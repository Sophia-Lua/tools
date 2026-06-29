import { useState, useMemo, useCallback } from 'react'

function inferType(value: any): any {
  if (value === null) return { type: 'null' }
  if (Array.isArray(value)) {
    if (value.length === 0) return { type: 'array', items: {} }
    const first = value[0]
    if (first === null) return { type: 'array', items: { type: 'null' } }
    if (Array.isArray(first)) return { type: 'array', items: inferType(first) }
    if (typeof first === 'object') return { type: 'array', items: inferObject(first) }
    return { type: 'array', items: { type: typeof first } }
  }
  if (typeof value === 'object') return inferObject(value)
  return { type: typeof value }
}

function inferObject(obj: any): any {
  const properties: Record<string, any> = {}
  const required: string[] = []
  for (const [key, val] of Object.entries(obj)) {
    properties[key] = inferType(val)
    required.push(key)
  }
  return {
    type: 'object',
    properties,
    required,
  }
}

export default function JsonSchemaGenerator() {
  const [input, setInput] = useState('')
  const [schemaName, setSchemaName] = useState('Root')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const output = useMemo(() => {
    if (!input.trim()) {
      setError('')
      return ''
    }
    try {
      const parsed = JSON.parse(input)
      const schema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        title: schemaName || 'Root',
        ...inferType(parsed),
      }
      setError('')
      return JSON.stringify(schema, null, 2)
    } catch (e: any) {
      setError(`Invalid JSON: ${e.message}`)
      return ''
    }
  }, [input, schemaName])

  const copyToClipboard = useCallback(() => {
    if (output) {
      navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }, [output])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-[var(--color-text)]">Schema Name:</label>
        <input
          type="text"
          value={schemaName}
          onChange={(e) => setSchemaName(e.target.value)}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-[var(--color-error)]/10 px-3 py-2 text-sm text-[var(--color-error)]">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[var(--color-text)]">JSON Input</label>
          <textarea
            className="w-full h-64 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 font-mono text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-y"
            placeholder='{"name": "John", "age": 30}'
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-[var(--color-text)]">JSON Schema</label>
            {output && (
              <button onClick={copyToClipboard} className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] px-3 py-1 text-xs font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors">
                {copied ? 'Copied!' : 'Copy'}
              </button>
            )}
          </div>
          <textarea
            className="w-full h-64 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3 font-mono text-sm text-[var(--color-text)] resize-y"
            readOnly
            value={output}
            placeholder="Schema will appear here..."
          />
        </div>
      </div>
    </div>
  )
}
