import { useState, useCallback } from 'react'

interface Header {
  key: string
  value: string
}

interface ResponseData {
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
  time: number
}

const methods = ['GET', 'POST', 'PUT', 'DELETE'] as const

export default function ApiTester() {
  const [method, setMethod] = useState<string>('GET')
  const [url, setUrl] = useState('')
  const [headers, setHeaders] = useState<Header[]>([{ key: '', value: '' }])
  const [body, setBody] = useState('')
  const [response, setResponse] = useState<ResponseData | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const addHeader = useCallback(() => {
    setHeaders((prev) => [...prev, { key: '', value: '' }])
  }, [])

  const removeHeader = useCallback((index: number) => {
    setHeaders((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const updateHeader = useCallback((index: number, field: 'key' | 'value', val: string) => {
    setHeaders((prev) => prev.map((h, i) => (i === index ? { ...h, [field]: val } : h)))
  }, [])

  const sendRequest = useCallback(async () => {
    if (!url.trim()) {
      setError('URL is required')
      return
    }

    setLoading(true)
    setError('')
    setResponse(null)

    const startTime = performance.now()

    try {
      const headerObj: Record<string, string> = {}
      headers.forEach((h) => {
        if (h.key.trim()) headerObj[h.key.trim()] = h.value
      })

      const fetchOptions: RequestInit = {
        method,
        headers: headerObj,
      }

      if (['POST', 'PUT'].includes(method) && body.trim()) {
        fetchOptions.body = body
        if (!headerObj['Content-Type'] && !headerObj['content-type']) {
          fetchOptions.headers = { ...fetchOptions.headers, 'Content-Type': 'application/json' }
        }
      }

      const res = await fetch(url, fetchOptions)
      const elapsed = Math.round(performance.now() - startTime)

      const resHeaders: Record<string, string> = {}
      res.headers.forEach((v, k) => { resHeaders[k] = v })

      const text = await res.text()

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: resHeaders,
        body: text,
        time: elapsed,
      })
    } catch (e: any) {
      setError(`Request failed: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }, [method, url, headers, body])

  const inputClass = 'rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm font-mono text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className={`${inputClass} cursor-pointer`}
        >
          {methods.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://api.example.com/endpoint"
          className={`${inputClass} flex-1`}
        />
        <button
          onClick={sendRequest}
          disabled={loading}
          className="rounded-lg bg-[var(--color-primary)] px-5 py-1.5 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--color-text)]">Headers</span>
          <button onClick={addHeader} className="text-xs text-[var(--color-primary)] hover:underline">
            + Add
          </button>
        </div>
        {headers.map((h, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              value={h.key}
              onChange={(e) => updateHeader(i, 'key', e.target.value)}
              placeholder="Key"
              className={`${inputClass} flex-1`}
            />
            <input
              type="text"
              value={h.value}
              onChange={(e) => updateHeader(i, 'value', e.target.value)}
              placeholder="Value"
              className={`${inputClass} flex-1`}
            />
            <button
              onClick={() => removeHeader(i)}
              className="px-2 text-[var(--color-text-secondary)] hover:text-[var(--color-error)] transition-colors"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {['POST', 'PUT'].includes(method) && (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-[var(--color-text)]">Body</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder='{"key": "value"}'
            className={`${inputClass} h-32 resize-y`}
          />
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-[var(--color-error)]/10 px-3 py-2 text-sm text-[var(--color-error)]">
          {error}
        </div>
      )}

      {response && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span
              className="rounded px-2 py-0.5 text-xs font-bold"
              style={{
                backgroundColor: response.status < 400 ? 'var(--color-success)' : 'var(--color-error)',
                color: '#fff',
              }}
            >
              {response.status}
            </span>
            <span className="text-sm text-[var(--color-text-secondary)]">{response.statusText}</span>
            <span className="text-xs text-[var(--color-text-secondary)]">{response.time}ms</span>
          </div>

          <details className="rounded-lg border border-[var(--color-border)]">
            <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-[var(--color-text)]">
              Response Headers ({Object.keys(response.headers).length})
            </summary>
            <div className="border-t border-[var(--color-border)] p-3 font-mono text-xs">
              {Object.entries(response.headers).map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <span className="text-[var(--color-primary)]">{k}:</span>
                  <span className="text-[var(--color-text-secondary)]">{v}</span>
                </div>
              ))}
            </div>
          </details>

          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-[var(--color-text)]">Response Body</span>
            <pre className="max-h-96 overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 font-mono text-sm text-[var(--color-text)]">
              {response.body}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
