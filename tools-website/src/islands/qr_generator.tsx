import { useState, useCallback, useEffect } from "react"
import QRCode from "qrcode"

export default function QrGenerator() {
  const [input, setInput] = useState("https://example.com")
  const [darkColor, setDarkColor] = useState("#000000")
  const [lightColor, setLightColor] = useState("#ffffff")
  const [qrDataUrl, setQrDataUrl] = useState("")
  const [error, setError] = useState("")

  const generateQR = useCallback(async () => {
    if (!input.trim()) {
      setError("Please enter text or URL")
      return
    }
    setError("")
    try {
      const url = await QRCode.toDataURL(input, {
        width: 300,
        margin: 2,
        color: { dark: darkColor, light: lightColor },
      })
      setQrDataUrl(url)
    } catch {
      setError("Failed to generate QR code")
    }
  }, [input, darkColor, lightColor])

  useEffect(() => {
    generateQR()
  }, [])

  const downloadPng = useCallback(() => {
    if (!qrDataUrl) return
    const a = document.createElement("a")
    a.href = qrDataUrl
    a.download = "qr-code.png"
    a.click()
  }, [qrDataUrl])

  const copySvg = useCallback(async () => {
    if (!input.trim()) return
    try {
      const svg = await QRCode.toString(input, {
        type: "svg",
        width: 300,
        margin: 2,
        color: { dark: darkColor, light: lightColor },
      })
      await navigator.clipboard.writeText(svg)
    } catch {
      // ignore
    }
  }, [input, darkColor, lightColor])

  const inputStyle = {
    backgroundColor: "var(--color-surface)",
    borderColor: "var(--color-border)",
    color: "var(--color-text)",
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
          Text / URL
        </label>
        <input
          type="text"
          className="w-full p-2 rounded-lg border text-sm"
          style={inputStyle}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && generateQR()}
          placeholder="Enter text or URL..."
        />
      </div>

      <div className="flex gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Foreground</label>
          <input
            type="color"
            value={darkColor}
            onChange={(e) => setDarkColor(e.target.value)}
            className="h-8 w-8 cursor-pointer rounded border p-0"
            style={{ borderColor: "var(--color-border)" }}
          />
          <input
            type="text"
            value={darkColor}
            onChange={(e) => setDarkColor(e.target.value)}
            className="w-20 rounded border px-2 py-1 text-xs font-mono"
            style={inputStyle}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Background</label>
          <input
            type="color"
            value={lightColor}
            onChange={(e) => setLightColor(e.target.value)}
            className="h-8 w-8 cursor-pointer rounded border p-0"
            style={{ borderColor: "var(--color-border)" }}
          />
          <input
            type="text"
            value={lightColor}
            onChange={(e) => setLightColor(e.target.value)}
            className="w-20 rounded border px-2 py-1 text-xs font-mono"
            style={inputStyle}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={generateQR}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          Generate
        </button>
        {qrDataUrl && (
          <>
            <button
              onClick={downloadPng}
              className="px-4 py-2 rounded-lg text-sm font-medium border"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
              Download PNG
            </button>
            <button
              onClick={copySvg}
              className="px-4 py-2 rounded-lg text-sm font-medium border"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
              Copy SVG
            </button>
          </>
        )}
      </div>

      {error && (
        <p className="text-sm" style={{ color: "var(--color-error)" }}>{error}</p>
      )}

      {qrDataUrl && (
        <div className="flex justify-center p-4 rounded-lg border" style={{ borderColor: "var(--color-border)" }}>
          <img src={qrDataUrl} alt="QR Code" style={{ width: "100%", maxWidth: "300px", height: "auto" }} />
        </div>
      )}
    </div>
  )
}
