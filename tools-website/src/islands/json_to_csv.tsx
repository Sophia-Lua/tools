import { useState, useCallback } from 'react'

function flattenObject(obj: Record<string, any>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {}
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    const value = obj[key]
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, fullKey))
    } else if (Array.isArray(value)) {
      result[fullKey] = JSON.stringify(value)
    } else {
      result[fullKey] = value === null || value === undefined ? '' : String(value)
    }
  }
  return result
}

function escapeCsvField(field: string): string {
  if (/[",\r\n]/.test(field)) {
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}

export default function JsonToCsv() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [rowCount, setRowCount] = useState(0)
  const [colCount, setColCount] = useState(0)

  const convert = useCallback(() => {
    try {
      const parsed = JSON.parse(input)
      const arr = Array.isArray(parsed) ? parsed : [parsed]
      if (arr.length === 0) {
        setOutput('')
        setError('Input is an empty array')
        setRowCount(0)
        setColCount(0)
        return
      }

      const flatRows = arr.map((item) =>
        typeof item === 'object' && item !== null ? flattenObject(item) : { value: String(item) }
      )

      const allKeys = new Set<string>()
      flatRows.forEach((row) => Object.keys(row).forEach((k) => allKeys.add(k)))
      const headers = Array.from(allKeys)

      const csvLines = [
        headers.map(escapeCsvField).join(','),
        ...flatRows.map((row) => headers.map((h) => escapeCsvField(row[h] ?? '')).join(',')),
      ]

      setOutput(csvLines.join('\n'))
      setRowCount(arr.length)
      setColCount(headers.length)
      setError('')
      setCopied(false)
    } catch (e: any) {
      setError(`Error: ${e.message}`)
      setOutput('')
      setRowCount(0)
      setColCount(0)
    }
  }, [input])

  const copyToClipboard = useCallback(() => {
    if (output) {
      navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }, [output])

  const downloadCsv = useCallback(() => {
    if (!output) return
    const blob = new Blob([output], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'output.csv'
    a.click()
    URL.revokeObjectURL(url)
  }, [output])

  const handleInput = useCallback(
    (value: string) => {
      setInput(value)
      if (value.trim()) {
        try {
          const parsed = JSON.parse(value)
          const arr = Array.isArray(parsed) ? parsed : [parsed]
          if (arr.length === 0) {
            setOutput('')
            setRowCount(0)
            setColCount(0)
            setError('')
            return
          }
          const flatRows = arr.map((item: any) =>
            typeof item === 'object' && item !== null ? flattenObject(item) : { value: String(item) }
          )
          const allKeys = new Set<string>()
          flatRows.forEach((row: Record<string, string>) => Object.keys(row).forEach((k) => allKeys.add(k)))
          const headers = Array.from(allKeys)
          const csvLines = [
            headers.map(escapeCsvField).join(','),
            ...flatRows.map((row: Record<string, string>) => headers.map((h) => escapeCsvField(row[h] ?? '')).join(',')),
          ]
          setOutput(csvLines.join('\n'))
          setRowCount(arr.length)
          setColCount(headers.length)
          setError('')
          setCopied(false)
        } catch {
          setOutput('')
          setRowCount(0)
          setColCount(0)
        }
      } else {
        setOutput('')
        setRowCount(0)
        setColCount(0)
      }
    },
    []
  )

  return (
    <div className="flex flex-col gap-4">
      <textarea
        className="w-full h-48 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 font-mono text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-y"
        placeholder='[{"name":"Alice","age":30},{"name":"Bob","age":25}]'
        value={input}
        onChange={(e) => handleInput(e.target.value)}
      />

      <div className="flex gap-2">
        <button onClick={convert} className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] transition-colors">
          Convert
        </button>
        {output && (
          <>
            <button onClick={copyToClipboard} className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors">
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button onClick={downloadCsv} className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors">
              Download
            </button>
          </>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-[var(--color-error)]/10 px-3 py-2 text-sm text-[var(--color-error)]">
          {error}
        </div>
      )}

      {output && (
        <div className="text-xs text-[var(--color-text-secondary)]">
          {rowCount} rows × {colCount} columns
        </div>
      )}

      {output && (
        <textarea
          className="w-full h-48 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 font-mono text-sm text-[var(--color-text)] resize-y"
          readOnly
          value={output}
        />
      )}
    </div>
  )
}
