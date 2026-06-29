import { useState, useCallback, useEffect } from 'react'

type Delimiter = ',' | '\t' | ';'

function parseCSVRow(line: string, delimiter: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === delimiter) {
        cells.push(current)
        current = ''
      } else {
        current += ch
      }
    }
  }
  cells.push(current)
  return cells
}

function parseCSV(text: string, delimiter: Delimiter, hasHeader: boolean): { data: Record<string, string>[], rowCount: number } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '')
  if (lines.length === 0) return { data: [], rowCount: 0 }

  const headerLine = hasHeader ? lines[0] : ''
  const dataLines = hasHeader ? lines.slice(1) : lines

  const headers = hasHeader ? parseCSVRow(headerLine, delimiter) : []
  const data: Record<string, string>[] = []

  for (const line of dataLines) {
    const values = parseCSVRow(line, delimiter)
    if (hasHeader) {
      const obj: Record<string, string> = {}
      for (let i = 0; i < headers.length; i++) {
        obj[headers[i] || `col${i + 1}`] = values[i] || ''
      }
      data.push(obj)
    } else {
      const obj: Record<string, string> = {}
      values.forEach((v, i) => {
        obj[`col${i + 1}`] = v
      })
      data.push(obj)
    }
  }

  return { data, rowCount: data.length }
}

export default function CsvToJson() {
  const [input, setInput] = useState('name,age,email\nJohn,30,john@example.com\nJane,25,jane@example.com\nBob,35,bob@example.com')
  const [delimiter, setDelimiter] = useState<Delimiter>(',')
  const [hasHeader, setHasHeader] = useState(true)
  const [output, setOutput] = useState('')
  const [rowCount, setRowCount] = useState(0)
  const [copied, setCopied] = useState(false)

  const parse = useCallback(() => {
    try {
      const { data, rowCount: count } = parseCSV(input, delimiter, hasHeader)
      setOutput(JSON.stringify(data, null, 2))
      setRowCount(count)
      setCopied(false)
    } catch {
      setOutput('')
      setRowCount(0)
    }
  }, [input, delimiter, hasHeader])

  useEffect(() => {
    parse()
  }, [parse])

  const copyToClipboard = useCallback(() => {
    if (output) {
      navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }, [output])

  const delimiterLabels: Record<Delimiter, string> = {
    ',': 'Comma (,)',
    '\t': 'Tab',
    ';': 'Semicolon (;)',
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4 items-center">
        <div>
          <label className="block text-sm font-medium mb-1 text-[var(--color-text)]">Delimiter</label>
          <div className="flex gap-2">
            {(Object.keys(delimiterLabels) as Delimiter[]).map((d) => (
              <button
                key={d}
                onClick={() => setDelimiter(d)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  delimiter === d
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]'
                }`}
              >
                {delimiterLabels[d]}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 pt-5">
          <input
            type="checkbox"
            id="hasHeader"
            checked={hasHeader}
            onChange={(e) => setHasHeader(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="hasHeader" className="text-sm text-[var(--color-text)]">First row as header</label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-[var(--color-text)]">CSV Input</label>
        <textarea
          className="w-full h-48 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 font-mono text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-y"
          placeholder="Paste CSV here..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </div>

      {output && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-[var(--color-text-secondary)]">
            {rowCount} row{rowCount !== 1 ? 's' : ''}
          </span>
          <button onClick={copyToClipboard} className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-colors">
            {copied ? 'Copied!' : 'Copy JSON'}
          </button>
        </div>
      )}

      {output && (
        <div>
          <label className="block text-sm font-medium mb-1 text-[var(--color-text)]">JSON Output</label>
          <textarea
            className="w-full h-64 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3 font-mono text-sm text-[var(--color-text)] resize-y"
            readOnly
            value={output}
          />
        </div>
      )}
    </div>
  )
}
