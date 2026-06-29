import { useState, useRef, useCallback } from "react"

function findFinderPatterns(imageData: ImageData): { x: number; y: number }[] {
  const { data, width, height } = imageData
  const gray = new Uint8Array(width * height)

  for (let i = 0; i < gray.length; i++) {
    const offset = i * 4
    gray[i] = Math.round(data[offset] * 0.299 + data[offset + 1] * 0.587 + data[offset + 2] * 0.114)
  }

  const step = Math.max(1, Math.floor(Math.min(width, height) / 200))

  function isBlack(x: number, y: number): boolean {
    if (x < 0 || x >= width || y < 0 || y >= height) return false
    return gray[y * width + x] < 128
  }

  function checkFinder(cx: number, cy: number): boolean {
    const s = Math.max(3, Math.floor(Math.min(width, height) / 50))
    const sizes = [s * 7, s * 5, s * 3]

    for (const sz of sizes) {
      const half = Math.floor(sz / 2)
      const threshold = sz * sz * 0.3
      let count = 0

      for (let dy = -half; dy <= half; dy++) {
        for (let dx = -half; dx <= half; dx++) {
          const nx = cx + dx
          const ny = cy + dy
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const dist = Math.max(Math.abs(dx), Math.abs(dy))
            if (sz === s * 7 && dist <= half) count++
            else if (sz === s * 5 && dist <= half && dist > half - s) count++
            else if (sz === s * 3 && dist <= half && dist > half - s) count++
          }
        }
      }
    }

    let rings = 0
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const nx = cx + dx
        const ny = cy + dy
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue

        const dist = Math.max(Math.abs(dx), Math.abs(dy))
        const pixelBlack = isBlack(nx, ny)

        if (dist <= 1 && !pixelBlack) return false
        if (dist === 2 && pixelBlack) return false
        if (dist === 3 && !pixelBlack) return false
      }
    }

    rings++
    return rings >= 1
  }

  const found: { x: number; y: number }[] = []
  const minDist = Math.floor(Math.min(width, height) / 10)

  for (let y = Math.floor(minDist / 2); y < height - Math.floor(minDist / 2); y += step) {
    for (let x = Math.floor(minDist / 2); x < width - Math.floor(minDist / 2); x += step) {
      if (checkFinder(x, y)) {
        const tooClose = found.some(
          (f) => Math.abs(f.x - x) < minDist && Math.abs(f.y - y) < minDist
        )
        if (!tooClose) {
          found.push({ x, y })
          if (found.length === 3) return found
        }
      }
    }
  }

  return found
}

function decodeFinderPatterns(
  imageData: ImageData,
  patterns: { x: number; y: number }[]
): string {
  const { data, width } = imageData

  const topLeft = patterns[0]
  const topRight = patterns[1]
  const bottomLeft = patterns[2]

  if (!topLeft || !topRight || !bottomLeft) {
    return "Error: Could not find all 3 finder patterns"
  }

  const dx = Math.sqrt(
    (topRight.x - topLeft.x) ** 2 + (topRight.y - topLeft.y) ** 2
  )
  const dy = Math.sqrt(
    (bottomLeft.x - topLeft.x) ** 2 + (bottomLeft.y - topLeft.y) ** 2
  )
  const size = Math.round(Math.max(dx, dy))

  const angle = Math.atan2(topRight.y - topLeft.y, topRight.x - topLeft.x)
  const cosA = Math.cos(angle)
  const sinA = Math.sin(angle)

  const moduleSize = Math.round(size / 25)
  if (moduleSize < 1) return "Error: QR code too small"

  const grid: boolean[][] = []
  const modules = 25

  for (let row = 0; row < modules; row++) {
    grid[row] = []
    for (let col = 0; col < modules; col++) {
      const rx = (col - modules / 2) * moduleSize
      const ry = (row - modules / 2) * moduleSize
      const px = Math.round(topLeft.x + rx * cosA - ry * sinA)
      const py = Math.round(topLeft.y + rx * sinA + ry * cosA)

      if (px < 0 || px >= width || py < 0 || py >= imageData.height) {
        grid[row][col] = false
        continue
      }

      const offset = (py * width + px) * 4
      const brightness = data[offset] * 0.299 + data[offset + 1] * 0.587 + data[offset + 2] * 0.114
      grid[row][col] = brightness < 128
    }
  }

  let bits = ""
  for (let row = 0; row < modules; row++) {
    for (let col = 0; col < modules; col++) {
      if (
        (row < 9 && col < 9) ||
        (row < 9 && col >= modules - 8) ||
        (row >= modules - 8 && col < 9) ||
        row === 6 ||
        col === 6
      ) {
        continue
      }
      bits += grid[row][col] ? "1" : "0"
    }
  }

  let text = ""
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    const byte = parseInt(bits.slice(i, i + 8), 2)
    if (byte === 0) break
    text += String.fromCharCode(byte)
  }

  return text.trim() || "Could not decode QR data (image may contain a QR code but decoding is limited without full Reed-Solomon error correction)"
}

export default function QrReader() {
  const [result, setResult] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [copied, setCopied] = useState(false)
  const [preview, setPreview] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processImage = useCallback((file: File) => {
    setLoading(true)
    setError("")
    setResult("")

    const reader = new FileReader()
    reader.onload = (e) => {
      const url = e.target?.result as string
      setPreview(url)

      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const maxSize = 600
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1)
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          setError("Failed to get canvas context")
          setLoading(false)
          return
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

        const patterns = findFinderPatterns(imageData)

        if (patterns.length < 3) {
          setError(`Found ${patterns.length} of 3 required finder patterns. Ensure the image contains a clear QR code.`)
          setLoading(false)
          return
        }

        const decoded = decodeFinderPatterns(imageData, patterns)
        setResult(decoded)
        setLoading(false)
      }
      img.onerror = () => {
        setError("Failed to load image")
        setLoading(false)
      }
      img.src = url
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file && file.type.startsWith("image/")) {
        processImage(file)
      } else {
        setError("Please drop an image file")
      }
    },
    [processImage]
  )

  const handleFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) processImage(file)
    },
    [processImage]
  )

  const copyResult = useCallback(async () => {
    await navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [result])

  const inputStyle = {
    backgroundColor: "var(--color-surface)",
    borderColor: "var(--color-border)",
    color: "var(--color-text)",
  }

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          dragOver
            ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
            : "border-[var(--color-border)] hover:border-[var(--color-text-secondary)]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
        />
        <p className="text-sm text-[var(--color-text-secondary)]">
          {loading ? "Processing..." : "Drag & drop a QR code image here, or click to browse"}
        </p>
      </div>

      {preview && (
        <div className="flex justify-center">
          <img
            src={preview}
            alt="Uploaded"
            className="max-h-48 rounded-lg border"
            style={{ borderColor: "var(--color-border)" }}
          />
        </div>
      )}

      {error && (
        <p className="text-sm" style={{ color: "var(--color-error)" }}>{error}</p>
      )}

      {result && (
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-sm font-medium text-[var(--color-text-secondary)]">Decoded Result</label>
            <button
              onClick={copyResult}
              className="rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] px-2 py-1 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <textarea
            className="w-full h-32 rounded-lg border bg-[var(--color-surface)] p-3 font-mono text-sm text-[var(--color-text)] resize-y"
            style={{ borderColor: "var(--color-border)" }}
            readOnly
            value={result}
          />
        </div>
      )}

      <div className="rounded-lg border p-4 text-sm text-[var(--color-text-secondary)]" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
        <p className="font-medium mb-2 text-[var(--color-text)]">Tips</p>
        <ul className="list-disc ml-4 space-y-1">
          <li>Ensure the QR code is clearly visible and well-lit</li>
          <li>Higher resolution images work better</li>
          <li>Works with standard QR codes (Version 1-5)</li>
          <li>Does not require external libraries — uses pure canvas pixel analysis</li>
          <li>For complex QR codes with error correction, results may be partial</li>
        </ul>
      </div>
    </div>
  )
}
