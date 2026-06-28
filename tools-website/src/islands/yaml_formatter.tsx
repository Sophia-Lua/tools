import { useState, useCallback } from 'react'

function indent(level: number): string {
  return '  '.repeat(level)
}

function formatValue(value: unknown, level: number): string {
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'boolean') return String(value)
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') {
    if (value.includes('\n')) {
      return `|\n${value.split('\n').map((l) => `${indent(level + 1)}${l}`).join('\n')}`
    }
    if (/[:{}\[\],&*?|>!%@`]/.test(value) || value.trim() !== value || value === '') {
      return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
    }
    return value
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    return `\n${value.map((item) => {
      const formatted = formatValue(item, level + 1)
      if (typeof item === 'object' && item !== null) {
        return `${indent(level + 1)}- ${formatted.trimStart()}`
      }
      return `${indent(level + 1)}- ${formatted}`
    }).join('\n')}`
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    if (entries.length === 0) return '{}'
    return `\n${entries.map(([k, v]) => {
      const formatted = formatValue(v, level + 1)
      if (typeof v === 'object' && v !== null && !Array.isArray(v) && Object.keys(v as Record<string, unknown>).length > 0) {
        return `${indent(level + 1)}${k}:${formatted}`
      }
      if (Array.isArray(v) && v.length > 0) {
        return `${indent(level + 1)}${k}:${formatted}`
      }
      return `${indent(level + 1)}${k}: ${formatted}`
    }).join('\n')}`
  }
  return String(value)
}

function formatYaml(input: string): string {
  try {
    const parsed = parseSimpleYaml(input)
    return formatValue(parsed, 0).trimStart()
  } catch {
    return input
  }
}

function parseSimpleYaml(text: string): unknown {
  const lines = text.split('\n')
  const root: Record<string, unknown> = {}
  const stack: { obj: Record<string, unknown>; indent: number }[] = [{ obj: root, indent: -1 }]

  for (const raw of lines) {
    const trimmed = raw.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const match = raw.match(/^(\s*)(- )?(.*?):\s*(.*)$/)
    if (!match) continue

    const [, spaces, isDash, key, rawVal] = match
    const currentIndent = spaces.length

    while (stack.length > 1 && stack[stack.length - 1].indent >= currentIndent) {
      stack.pop()
    }

    const parent = stack[stack.length - 1].obj

    if (isDash) {
      if (!Array.isArray(parent[key])) parent[key] = []
      const arr = parent[key] as unknown[]
      if (rawVal) {
        arr.push(parseYamlValue(rawVal))
      } else {
        const child: Record<string, unknown> = {}
        arr.push(child)
        stack.push({ obj: child, indent: currentIndent + 2 })
      }
    } else {
      const val = parseYamlValue(rawVal)
      if (val !== undefined) {
        parent[key] = val
      } else {
        parent[key] = {}
        stack.push({ obj: parent[key] as Record<string, unknown>, indent: currentIndent })
      }
    }
  }

  return root
}

function parseYamlValue(val: string): unknown {
  if (!val || val === '~' || val === 'null') return null
  if (val === 'true') return true
  if (val === 'false') return false
  if (/^-?\d+$/.test(val)) return parseInt(val, 10)
  if (/^-?\d+\.\d+$/.test(val)) return parseFloat(val)
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    return val.slice(1, -1)
  }
  if (val === '[]') return []
  if (val === '{}') return {}
  return val
}

export default function YamlFormatter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const copyToClipboard = useCallback(() => {
    if (output) {
      navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }, [output])

  const format = useCallback(() => {
    try {
      const formatted = formatYaml(input)
      setOutput(formatted)
      setError('')
      setCopied(false)
    } catch (e: any) {
      setError(`Error: ${e.message}`)
      setOutput('')
    }
  }, [input])

  return (
    <div className="flex flex-col gap-4">
      <textarea
        className="w-full h-48 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 font-mono text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-y"
        placeholder="Paste YAML here..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <div className="flex gap-2">
        <button onClick={format} className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] transition-colors">
          Format
        </button>
        {output && (
          <button onClick={copyToClipboard} className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors">
            {copied ? 'Copied!' : 'Copy'}
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-[var(--color-error)]/10 px-3 py-2 text-sm text-[var(--color-error)]">
          {error}
        </div>
      )}

      {output && (
        <pre className="w-full min-h-[12rem] max-h-96 overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 font-mono text-sm text-[var(--color-text)]">
          {output}
        </pre>
      )}
    </div>
  )
}
