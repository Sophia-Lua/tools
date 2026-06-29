import { useState, useMemo } from 'react'

const FONTS = [
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
  { label: 'Courier New', value: '"Courier New", monospace' },
  { label: 'Monospace', value: 'monospace' },
  { label: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif' },
  { label: 'Palatino', value: '"Palatino Linotype", serif' },
  { label: 'Garamond', value: 'Garamond, serif' },
  { label: 'Comic Sans', value: '"Comic Sans MS", cursive' },
  { label: 'Impact', value: 'Impact, sans-serif' },
  { label: 'Lucida Console', value: '"Lucida Console", monospace' },
]

const DEFAULT_TEXT = 'The quick brown fox jumps over the lazy dog\nPack my box with five dozen liquor jugs\n0123456789 !@#$%^&*()'

export default function FontCompare() {
  const [text, setText] = useState(DEFAULT_TEXT)
  const [selectedFonts, setSelectedFonts] = useState<string[]>([FONTS[0].value, FONTS[2].value, FONTS[4].value, FONTS[5].value])
  const [fontSize, setFontSize] = useState(16)
  const [lineHeight, setLineHeight] = useState(1.5)
  const [fontWeight, setFontWeight] = useState(400)
  const [fgColor, setFgColor] = useState('#e5e7eb')
  const [bgColor, setBgColor] = useState('#1a1b26')

  const toggleFont = (value: string) => {
    setSelectedFonts((prev) => {
      if (prev.includes(value)) return prev.filter((f) => f !== value)
      if (prev.length >= 4) return prev
      return [...prev, value]
    })
  }

  const previewStyle = useMemo(() => ({
    fontSize: `${fontSize}px`,
    lineHeight: lineHeight.toString(),
    fontWeight: fontWeight.toString(),
    color: fgColor,
    backgroundColor: bgColor,
  }), [fontSize, lineHeight, fontWeight, fgColor, bgColor])

  const selectedFontLabels = useMemo(
    () => FONTS.filter((f) => selectedFonts.includes(f.value)).map((f) => f.label),
    [selectedFonts]
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-[var(--color-text-secondary)]">Sample Text</label>
        <textarea
          className="w-full h-20 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-y"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-[var(--color-text-secondary)]">Fonts (select 2-4)</label>
        <div className="flex flex-wrap gap-2">
          {FONTS.map((f) => (
            <button
              key={f.value}
              onClick={() => toggleFont(f.value)}
              className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                selectedFonts.includes(f.value)
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-[var(--color-text-secondary)]">Size:</label>
          <input
            type="range"
            min={8}
            max={72}
            value={fontSize}
            onChange={(e) => setFontSize(+e.target.value)}
            className="w-24"
          />
          <span className="text-sm font-mono text-[var(--color-text)] w-10">{fontSize}px</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-[var(--color-text-secondary)]">Line Height:</label>
          <input
            type="range"
            min={0.8}
            max={3}
            step={0.1}
            value={lineHeight}
            onChange={(e) => setLineHeight(+e.target.value)}
            className="w-24"
          />
          <span className="text-sm font-mono text-[var(--color-text)] w-10">{lineHeight}</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-[var(--color-text-secondary)]">Weight:</label>
          <select
            value={fontWeight}
            onChange={(e) => setFontWeight(+e.target.value)}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          >
            {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-[var(--color-text-secondary)]">Text:</label>
          <input
            type="color"
            value={fgColor}
            onChange={(e) => setFgColor(e.target.value)}
            className="h-7 w-7 rounded border border-[var(--color-border)] cursor-pointer"
          />
          <span className="text-xs font-mono text-[var(--color-text-secondary)]">{fgColor}</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-[var(--color-text-secondary)]">BG:</label>
          <input
            type="color"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            className="h-7 w-7 rounded border border-[var(--color-border)] cursor-pointer"
          />
          <span className="text-xs font-mono text-[var(--color-text-secondary)]">{bgColor}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {selectedFonts.map((fontValue, i) => {
          const fontLabel = selectedFontLabels[i]
          return (
            <div
              key={fontValue}
              className="rounded-lg border border-[var(--color-border)] overflow-hidden"
            >
              <div className="px-3 py-1.5 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
                <span className="text-xs font-medium text-[var(--color-text-secondary)]">{fontLabel}</span>
              </div>
              <div
                className="p-4 whitespace-pre-wrap break-words"
                style={{ ...previewStyle, fontFamily: fontValue }}
              >
                {text}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
