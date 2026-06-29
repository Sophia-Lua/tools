import { useState, useCallback } from 'react'

function stripJson5Comments(text: string): string {
  let result = ''
  let inString = false
  let stringChar = ''
  let i = 0
  while (i < text.length) {
    const ch = text[i]
    if (inString) {
      result += ch
      if (ch === '\\' && i + 1 < text.length) {
        result += text[i + 1]
        i += 2
        continue
      }
      if (ch === stringChar) inString = false
      i++
      continue
    }
    if (ch === '"' || ch === "'") {
      inString = true
      stringChar = ch
      result += ch
      i++
      continue
    }
    if (ch === '/' && i + 1 < text.length) {
      if (text[i + 1] === '/') {
        while (i < text.length && text[i] !== '\n') i++
        continue
      }
      if (text[i + 1] === '*') {
        i += 2
        while (i + 1 < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++
        i += 2
        continue
      }
    }
    result += ch
    i++
  }
  return result
}

function formatJson(text: string, indent: number): string {
  const cleaned = stripJson5Comments(text.trim())
  const parsed = JSON.parse(cleaned)
  return JSON.stringify(parsed, null, indent)
}

function minifyJson(text: string): string {
  const cleaned = stripJson5Comments(text.trim())
  const parsed = JSON.parse(cleaned)
  return JSON.stringify(parsed)
}

export default function JsonPrettier() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [indent, setIndent] = useState(2)
  const [errorPos, setErrorPos] = useState('')
  const [copied, setCopied] = useState(false)

  const clearError = useCallback(() => {
    setError('')
    setErrorPos('')
  }, [])

  const beautify = useCallback(() => {
    try {
      setOutput(formatJson(input, indent))
      clearError()
      setCopied(false)
    } catch (e: any) {
      setError(e.message)
      setOutput('')
      const posMatch = e.message.match(/position\s+(\d+)/)
      if (posMatch) {
        const pos = parseInt(posMatch[1])
        const before = input.slice(0, pos)
        const line = before.split('\n').length
        const col = pos - before.lastIndexOf('\n')
        setErrorPos(`Line ${line}, Column ${col}`)
      } else {
        setErrorPos('')
      }
    }
  }, [input, indent])

  const minify = useCallback(() => {
    try {
      setOutput(minifyJson(input))
      clearError()
      setCopied(false)
    } catch (e: any) {
      setError(e.message)
      setOutput('')
      setErrorPos('')
    }
  }, [input])

  const validate = useCallback(() => {
    try {
      formatJson(input, 2)
      setError('Valid JSON / JSON5 / JSONC')
      setOutput('')
      setCopied(false)
      setErrorPos('')
    } catch (e: any) {
      setError(e.message)
      setOutput('')
      const posMatch = e.message.match(/position\s+(\d+)/)
      if (posMatch) {
        const pos = parseInt(posMatch[1])
        const before = input.slice(0, pos)
        const line = before.split('\n').length
        const col = pos - before.lastIndexOf('\n')
        setErrorPos(`Line ${line}, Column ${col}`)
      } else {
        setErrorPos('')
      }
    }
  }, [input])

  const copyToClipboard = useCallback(() => {
    if (output) {
      navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }, [output])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-[var(--color-text-secondary)]">Input (JSON, JSON5, JSONC)</label>
        <textarea
          className="w-full h-48 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 font-mono text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-y"
          placeholder='{"key": "value", "list": [1, 2, 3]}'
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm font-medium text-[var(--color-text-secondary)]">Indent:</label>
        <div className="flex gap-1">
          {[2, 4].map((n) => (
            <button
              key={n}
              onClick={() => setIndent(n)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                indent === n
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <button onClick={beautify} className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] transition-colors">
          Beautify
        </button>
        <button onClick={minify} className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors">
          Minify
        </button>
        <button onClick={validate} className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors">
          Validate
        </button>
      </div>

      {error && (
        <div className={`rounded-lg px-3 py-2 text-sm ${error.includes('Valid') ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]' : 'bg-[var(--color-error)]/10 text-[var(--color-error)]'}`}>
          {error}
          {errorPos && <span className="ml-2 opacity-75">at {errorPos}</span>}
        </div>
      )}

      {output && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-[var(--color-text-secondary)]">Output</label>
            <button onClick={copyToClipboard} className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors">
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="w-full min-h-[12rem] max-h-96 overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 font-mono text-sm text-[var(--color-text)]">
            {output}
          </pre>
        </div>
      )}
    </div>
  )
}
