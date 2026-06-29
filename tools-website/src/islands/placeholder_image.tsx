import { useState, useRef, useCallback, useEffect } from "react"

export default function PlaceholderImage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [width, setWidth] = useState(400)
  const [height, setHeight] = useState(300)
  const [bgColor, setBgColor] = useState("#cccccc")
  const [text, setText] = useState("400 × 300")
  const [fontSize, setFontSize] = useState(24)

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = width
    canvas.height = height

    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, width, height)

    const r = parseInt(bgColor.slice(1, 3), 16)
    const g = parseInt(bgColor.slice(3, 5), 16)
    const b = parseInt(bgColor.slice(5, 7), 16)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    ctx.fillStyle = brightness > 128 ? "#333333" : "#ffffff"

    ctx.font = `${fontSize}px sans-serif`
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(text, width / 2, height / 2)
  }, [width, height, bgColor, text, fontSize])

  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  const downloadPng = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const a = document.createElement("a")
    a.href = canvas.toDataURL("image/png")
    a.download = "placeholder.png"
    a.click()
  }, [])

  const inputStyle = {
    backgroundColor: "var(--color-surface)",
    borderColor: "var(--color-border)",
    color: "var(--color-text)",
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">Width</label>
          <input
            type="number"
            className="w-full p-2 rounded-lg border text-sm"
            style={inputStyle}
            value={width}
            min={1}
            max={2000}
            onChange={(e) => setWidth(Math.max(1, parseInt(e.target.value) || 1))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">Height</label>
          <input
            type="number"
            className="w-full p-2 rounded-lg border text-sm"
            style={inputStyle}
            value={height}
            min={1}
            max={2000}
            onChange={(e) => setHeight(Math.max(1, parseInt(e.target.value) || 1))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">Background Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="h-8 w-8 cursor-pointer rounded border p-0"
              style={{ borderColor: "var(--color-border)" }}
            />
            <input
              type="text"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="flex-1 p-2 rounded-lg border text-sm font-mono"
              style={inputStyle}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">Label Text</label>
          <input
            type="text"
            className="w-full p-2 rounded-lg border text-sm"
            style={inputStyle}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Label text..."
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">
          Font Size: {fontSize}px
        </label>
        <input
          type="range"
          min={8}
          max={120}
          value={fontSize}
          onChange={(e) => setFontSize(parseInt(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={downloadPng}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          Download PNG
        </button>
      </div>

      <div className="flex justify-center p-4 rounded-lg border" style={{ borderColor: "var(--color-border)" }}>
        <canvas
          ref={canvasRef}
          className="max-w-full rounded"
          style={{ width: Math.min(width, 500), height: "auto", aspectRatio: `${width} / ${height}` }}
        />
      </div>
    </div>
  )
}
