import { useState, useMemo, useCallback } from 'react'

interface ParsedUrl {
  protocol: string
  hostname: string
  port: string
  pathname: string
  searchParams: { key: string; value: string }[]
  hash: string
}

const DEFAULT_URL = 'https://example.com:8080/path?foo=bar&baz=qux#section'

function parseUrl(url: string): ParsedUrl | null {
  try {
    const u = new URL(url)
    const searchParams: { key: string; value: string }[] = []
    u.searchParams.forEach((value, key) => {
      searchParams.push({ key, value })
    })
    return {
      protocol: u.protocol,
      hostname: u.hostname,
      port: u.port,
      pathname: u.pathname,
      searchParams,
      hash: u.hash ? u.hash.slice(1) : '',
    }
  } catch {
    return null
  }
}

function rebuildUrl(parsed: ParsedUrl): string {
  let url = ''
  if (parsed.protocol) url += parsed.protocol + '//'
  url += parsed.hostname
  if (parsed.port) url += ':' + parsed.port
  url += parsed.pathname
  if (parsed.searchParams.length > 0) {
    const qs = parsed.searchParams
      .map((p) => encodeURIComponent(p.key) + '=' + encodeURIComponent(p.value))
      .join('&')
    url += '?' + qs
  }
  if (parsed.hash) url += '#' + parsed.hash
  return url
}

export default function UrlParser() {
  const [url, setUrl] = useState(DEFAULT_URL)
  const [copied, setCopied] = useState(false)

  const parsed = useMemo(() => parseUrl(url), [url])

  const output = useMemo(() => {
    if (!parsed) return ''
    return rebuildUrl(parsed)
  }, [parsed])

  const copyToClipboard = useCallback(() => {
    if (output) {
      navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }, [output])

  const updateParam = useCallback((index: number, field: 'key' | 'value', val: string) => {
    setUrl((prev) => {
      const p = parseUrl(prev)
      if (!p) return prev
      p.searchParams[index][field] = val
      return rebuildUrl(p)
    })
  }, [])

  const addParam = useCallback(() => {
    setUrl((prev) => {
      const p = parseUrl(prev)
      if (!p) return prev
      p.searchParams.push({ key: '', value: '' })
      return rebuildUrl(p)
    })
  }, [])

  const removeParam = useCallback((index: number) => {
    setUrl((prev) => {
      const p = parseUrl(prev)
      if (!p) return prev
      p.searchParams.splice(index, 1)
      return rebuildUrl(p)
    })
  }, [])

  const fieldRow = (label: string, value: string) => (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-24 shrink-0 text-sm font-medium text-[var(--color-text-secondary)]">{label}</span>
      <code className="flex-1 rounded bg-[var(--color-bg-secondary)] px-2 py-1 font-mono text-sm text-[var(--color-text)] break-all">{value || <span className="text-[var(--color-text-tertiary)]">empty</span>}</code>
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-[var(--color-text-secondary)]">URL</label>
        <textarea
          className="w-full h-20 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 font-mono text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-y"
          placeholder="Enter a URL to parse..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>

      {!parsed && url && (
        <div className="rounded-lg bg-[var(--color-error)]/10 px-3 py-2 text-sm text-[var(--color-error)]">
          Invalid URL
        </div>
      )}

      {parsed && (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-1">
          {fieldRow('Protocol', parsed.protocol)}
          {fieldRow('Hostname', parsed.hostname)}
          {fieldRow('Port', parsed.port || '(default)')}
          {fieldRow('Pathname', parsed.pathname)}
          {fieldRow('Hash', parsed.hash || '(none)')}
        </div>
      )}

      {parsed && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-[var(--color-text-secondary)]">Search Parameters</label>
            <button onClick={addParam} className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] px-3 py-1 text-xs font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors">
              + Add
            </button>
          </div>
          {parsed.searchParams.length === 0 && (
            <p className="text-sm text-[var(--color-text-tertiary)]">No query parameters</p>
          )}
          {parsed.searchParams.map((param, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 font-mono text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                placeholder="key"
                value={param.key}
                onChange={(e) => updateParam(i, 'key', e.target.value)}
              />
              <span className="text-[var(--color-text-tertiary)]">=</span>
              <input
                type="text"
                className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 font-mono text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                placeholder="value"
                value={param.value}
                onChange={(e) => updateParam(i, 'value', e.target.value)}
              />
              <button onClick={() => removeParam(i)} className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] px-2 py-1.5 text-xs text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-colors">
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      {output && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-[var(--color-text-secondary)]">Reconstructed URL</label>
            <button onClick={copyToClipboard} className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors">
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="w-full overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3 font-mono text-sm text-[var(--color-text)] break-all">{output}</pre>
        </div>
      )}
    </div>
  )
}
