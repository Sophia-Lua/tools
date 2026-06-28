import { useState, useRef, useCallback } from 'react'

const DEFAULT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="40" fill="#3b82f6"/>
  <rect x="30" y="30" width="40" height="40" fill="#fff" rx="4"/>
</svg>`

export default function SvgViewer() {
  const [svgCode, setSvgCode] = useState(DEFAULT_SVG)
  const [zoom, setZoom] = useState(1)
  const [error, setError] = useState('')
  const svgContainerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const validateSvg = useCallback((code: string): boolean => {
    if (!code.trim()) {
      setError('SVG code is empty')
      return false
    }
    const parser = new DOMParser()
    const doc = parser.parseFromString(code, 'image/svg+xml')
    const parseError = doc.querySelector('parsererror')
    if (parseError) {
      setError('Invalid SVG: ' + parseError.textContent?.slice(0, 120))
      return false
    }
    setError('')
    return true
  }, [])

  const handleCodeChange = useCallback((value: string) => {
    setSvgCode(value)
    if (value.trim()) {
      validateSvg(value)
    } else {
      setError('SVG code is empty')
    }
  }, [validateSvg])

  const zoomIn = useCallback(() => setZoom(z => Math.min(z + 0.25, 5)), [])
  const zoomOut = useCallback(() => setZoom(z => Math.max(z - 0.25, 0.25)), [])
  const resetZoom = useCallback(() => setZoom(1), [])

  const exportSvg = useCallback(() => {
    const blob = new Blob([svgCode], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'image.svg'
    a.click()
    URL.revokeObjectURL(url)
  }, [svgCode])

  const exportPng = useCallback(() => {
    if (!validateSvg(svgCode)) return
    const img = new Image()
    const svgBlob = new Blob([svgCode], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(svgBlob)
    img.onload = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.width = img.naturalWidth || 512
      canvas.height = img.naturalHeight || 512
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      canvas.toBlob((blob) => {
        if (!blob) {
          setError('PNG export failed')
          return
        }
        const pngUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = pngUrl
        a.download = 'image.png'
        a.click()
        URL.revokeObjectURL(pngUrl)
        URL.revokeObjectURL(url)
      }, 'image/png')
    }
    img.onerror = () => {
      setError('Failed to render SVG for PNG export')
      URL.revokeObjectURL(url)
    }
    img.src = url
  }, [svgCode, validateSvg])

  const isValid = !error && svgCode.trim()

  return (
    <div className="flex flex-col gap-4">
      <canvas ref={canvasRef} className="hidden" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">SVG Code</span>
          </div>
          <textarea
            className="w-full h-80 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 font-mono text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-y"
            placeholder="Paste SVG code here..."
            value={svgCode}
            onChange={(e) => handleCodeChange(e.target.value)}
            spellCheck={false}
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">Preview</span>
            <div className="flex items-center gap-1">
              <button
                onClick={zoomOut}
                className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
                title="Zoom out"
              >
                −
              </button>
              <span className="text-xs text-[var(--color-text-secondary)] w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={zoomIn}
                className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
                title="Zoom in"
              >
                +
              </button>
              <button
                onClick={resetZoom}
                className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
                title="Reset zoom"
              >
                Reset
              </button>
            </div>
          </div>

          <div
            ref={svgContainerRef}
            className="w-full h-80 overflow-auto rounded-lg border border-[var(--color-border)] flex items-center justify-center"
            style={{
              backgroundImage: `
                linear-gradient(45deg, #e5e7eb 25%, transparent 25%),
                linear-gradient(-45deg, #e5e7eb 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, #e5e7eb 75%),
                linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)
              `,
              backgroundSize: '16px 16px',
              backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
              backgroundColor: '#fff',
            }}
          >
            {isValid ? (
              <div
                className="w-full h-full flex items-center justify-center p-4"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
                dangerouslySetInnerHTML={{ __html: svgCode.replace(/<svg([^>]*)>/, '<svg$1 width="100%" height="100%" style="max-width:100%;max-height:100%;display:block;margin:auto;">') }}
              />
            ) : (
              <div className="p-4 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {error || 'Enter valid SVG code to preview'}
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div
          className="rounded-lg p-3 text-sm"
          style={{ backgroundColor: 'color-mix(in srgb, var(--color-error, #ef4444) 10%, transparent)', color: 'var(--color-error, #ef4444)' }}
        >
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={exportSvg}
          disabled={!svgCode.trim()}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 transition-colors"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          Export SVG
        </button>
        <button
          onClick={exportPng}
          disabled={!svgCode.trim()}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 transition-colors"
          style={{ backgroundColor: 'var(--color-success, #22c55e)' }}
        >
          Export PNG
        </button>
      </div>
    </div>
  )
}
