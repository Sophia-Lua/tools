import { useState, useCallback, useMemo } from 'react'

interface CellConfig {
  colspan: number
  rowspan: number
}

export default function CssGrid() {
  const [rows, setRows] = useState(3)
  const [cols, setCols] = useState(3)
  const [gap, setGap] = useState(8)
  const [cells, setCells] = useState<CellConfig[]>([])
  const [copied, setCopied] = useState('')

  const totalCells = rows * cols

  const ensureCells = useCallback(() => {
    setCells((prev) => {
      const next = [...prev]
      while (next.length < totalCells) {
        next.push({ colspan: 1, rowspan: 1 })
      }
      return next.slice(0, totalCells)
    })
  }, [totalCells])

  const updateCell = useCallback((index: number, field: 'colspan' | 'rowspan', value: number) => {
    setCells((prev) => {
      const next = [...prev]
      while (next.length <= index) next.push({ colspan: 1, rowspan: 1 })
      next[index] = { ...next[index], [field]: Math.max(1, Math.min(field === 'colspan' ? cols : rows, value)) }
      return next
    })
  }, [cols, rows])

  const gridStyle = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gridTemplateRows: `repeat(${rows}, 1fr)`,
    gap: `${gap}px`,
  }), [rows, cols, gap])

  const gridCSS = useMemo(() => {
    return `.grid-container {
  display: grid;
  grid-template-columns: repeat(${cols}, 1fr);
  grid-template-rows: repeat(${rows}, 1fr);
  gap: ${gap}px;
}

.grid-item {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  padding: 1rem;
  text-align: center;
  border-radius: 0.5rem;
}`
  }, [rows, cols, gap])

  const htmlTemplate = useMemo(() => {
    let items = ''
    for (let i = 0; i < totalCells; i++) {
      const cell = cells[i] || { colspan: 1, rowspan: 1 }
      const attrs = []
      if (cell.colspan > 1) attrs.push(`colspan="${cell.colspan}"`)
      if (cell.rowspan > 1) attrs.push(`rowspan="${cell.rowspan}"`)
      const attrStr = attrs.length ? ' ' + attrs.join(' ') : ''
      items += `  <div class="grid-item"${attrStr}>Cell ${i + 1}</div>\n`
    }
    return `<div class="grid-container">\n${items}</div>`
  }, [totalCells, cells])

  const copyToClipboard = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(''), 1500)
  }, [])

  const inputClass = 'w-20 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-sm font-mono text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-center'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-[var(--color-text)]">Rows</label>
          <input
            type="number"
            min={1}
            max={12}
            value={rows}
            onChange={(e) => { setRows(+e.target.value); ensureCells() }}
            className={inputClass}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-[var(--color-text)]">Columns</label>
          <input
            type="number"
            min={1}
            max={12}
            value={cols}
            onChange={(e) => { setCols(+e.target.value); ensureCells() }}
            className={inputClass}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-[var(--color-text)]">Gap</label>
          <input
            type="range"
            min={0}
            max={40}
            value={gap}
            onChange={(e) => setGap(+e.target.value)}
            className="w-32 accent-[var(--color-primary)]"
          />
          <span className="text-xs font-mono text-[var(--color-text-secondary)] w-10">{gap}px</span>
        </div>
      </div>

      {totalCells > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-[var(--color-text)]">Cell Span</span>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {Array.from({ length: totalCells }, (_, i) => {
              const cell = cells[i] || { colspan: 1, rowspan: 1 }
              return (
                <div key={i} className="flex flex-col gap-1 rounded border border-[var(--color-border)] p-1.5 text-xs">
                  <span className="text-[var(--color-text-secondary)]">Cell {i + 1}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[var(--color-text-tertiary)]">C</span>
                    <input
                      type="number"
                      min={1}
                      max={cols}
                      value={cell.colspan}
                      onChange={(e) => updateCell(i, 'colspan', +e.target.value)}
                      className="w-10 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-1 py-0.5 text-xs font-mono text-[var(--color-text)] text-center focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                    />
                    <span className="text-[var(--color-text-tertiary)]">R</span>
                    <input
                      type="number"
                      min={1}
                      max={rows}
                      value={cell.rowspan}
                      onChange={(e) => updateCell(i, 'rowspan', +e.target.value)}
                      className="w-10 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-1 py-0.5 text-xs font-mono text-[var(--color-text)] text-center focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div
        style={gridStyle}
        className="min-h-[12rem] rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-2"
      >
        {Array.from({ length: totalCells }, (_, i) => {
          const cell = cells[i] || { colspan: 1, rowspan: 1 }
          return (
            <div
              key={i}
              style={{
                gridColumn: cell.colspan > 1 ? `span ${cell.colspan}` : undefined,
                gridRow: cell.rowspan > 1 ? `span ${cell.rowspan}` : undefined,
              }}
              className="flex items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm font-medium text-[var(--color-text-secondary)]"
            >
              {i + 1}
            </div>
          )
        })}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--color-text)]">CSS</span>
          <button
            onClick={() => copyToClipboard(gridCSS, 'css')}
            className="text-xs text-[var(--color-primary)] hover:underline"
          >
            {copied === 'css' ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <pre className="max-h-48 overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 font-mono text-xs text-[var(--color-text)]">
          {gridCSS}
        </pre>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--color-text)]">HTML</span>
          <button
            onClick={() => copyToClipboard(htmlTemplate, 'html')}
            className="text-xs text-[var(--color-primary)] hover:underline"
          >
            {copied === 'html' ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <pre className="max-h-48 overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 font-mono text-xs text-[var(--color-text)]">
          {htmlTemplate}
        </pre>
      </div>
    </div>
  )
}
