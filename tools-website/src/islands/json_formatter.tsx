import { useState, useCallback } from 'react'

function syntaxHighlight(json: string): string {
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    (match) => {
      let cls = 'text-[var(--color-text-secondary)]'
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'text-[var(--color-primary)]'
        } else {
          cls = 'text-[var(--color-success)]'
        }
      } else if (/true|false/.test(match)) {
        cls = 'text-[var(--color-warning)]'
      } else if (/null/.test(match)) {
        cls = 'text-[var(--color-error)]'
      }
      return `<span class="${cls}">${match}</span>`
    }
  )
}

export default function JsonFormatter() {
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

  const validate = useCallback(() => {
    try {
      JSON.parse(input)
      setError('Valid JSON')
      setCopied(false)
    } catch (e: any) {
      setError(`Invalid JSON: ${e.message}`)
      setCopied(false)
    }
  }, [input])

  const format = useCallback(() => {
    try {
      const parsed = JSON.parse(input)
      const formatted = JSON.stringify(parsed, null, 2)
      setOutput(formatted)
      setError('')
      setCopied(false)
    } catch (e: any) {
      setError(`Invalid JSON: ${e.message}`)
      setOutput('')
    }
  }, [input])

  const minify = useCallback(() => {
    try {
      const parsed = JSON.parse(input)
      setOutput(JSON.stringify(parsed))
      setError('')
      setCopied(false)
    } catch (e: any) {
      setError(`Invalid JSON: ${e.message}`)
      setOutput('')
    }
  }, [input])

  const beautify = useCallback(() => {
    try {
      const parsed = JSON.parse(input)
      setOutput(JSON.stringify(parsed, null, 4))
      setError('')
      setCopied(false)
    } catch (e: any) {
      setError(`Invalid JSON: ${e.message}`)
      setOutput('')
    }
  }, [input])

  const highlighted = output ? syntaxHighlight(output) : ''

  return (
    <div className="flex flex-col gap-4">
      <textarea
        className="w-full h-48 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 font-mono text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-y"
        placeholder="Paste JSON here..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <div className="flex flex-wrap gap-2">
        <button onClick={format} className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] transition-colors">Format</button>
        <button onClick={beautify} className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors">Beautify</button>
        <button onClick={minify} className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors">Minify</button>
        <button onClick={validate} className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors">Validate</button>
        {output && (
          <button onClick={copyToClipboard} className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors">
            {copied ? 'Copied!' : 'Copy'}
          </button>
        )}
      </div>

      {error && (
        <div className={`rounded-lg px-3 py-2 text-sm ${error.startsWith('Valid') ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]' : 'bg-[var(--color-error)]/10 text-[var(--color-error)]'}`}>
          {error}
        </div>
      )}

      {output && (
        <pre
          className="w-full min-h-[12rem] max-h-96 overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 font-mono text-sm"
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      )}
    </div>
  )
}
