import { useState, useCallback } from 'react'

const ALGORITHMS = ['HS256', 'HS384', 'HS512'] as const
type Algorithm = typeof ALGORITHMS[number]

const ALGO_HASH: Record<Algorithm, string> = {
  HS256: 'SHA-256',
  HS384: 'SHA-384',
  HS512: 'SHA-512',
}

function base64UrlEncode(data: ArrayBuffer): string {
  const bytes = new Uint8Array(data)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function utf8Encode(str: string): Uint8Array {
  return new TextEncoder().encode(str)
}

export default function JwtGenerator() {
  const [header, setHeader] = useState(JSON.stringify({ alg: 'HS256', typ: 'JWT' }, null, 2))
  const [payload, setPayload] = useState(JSON.stringify({ sub: '1234567890', name: 'John Doe', iat: Math.floor(Date.now() / 1000) }, null, 2))
  const [secret, setSecret] = useState('your-secret-key')
  const [algorithm, setAlgorithm] = useState<Algorithm>('HS256')
  const [jwt, setJwt] = useState('')
  const [decodedHeader, setDecodedHeader] = useState('')
  const [decodedPayload, setDecodedPayload] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const generate = useCallback(async () => {
    setError('')
    setJwt('')
    setDecodedHeader('')
    setDecodedPayload('')
    try {
      const headerObj = JSON.parse(header)
      headerObj.alg = algorithm
      const headerStr = JSON.stringify(headerObj)
      const payloadStr = JSON.parse(payload) ? JSON.stringify(JSON.parse(payload)) : payload

      const encoder = new TextEncoder()
      const key = await crypto.subtle.importKey(
        'raw',
        utf8Encode(secret),
        { name: 'HMAC', hash: ALGO_HASH[algorithm] },
        false,
        ['sign']
      )

      const headerB64 = base64UrlEncode(utf8Encode(headerStr).buffer)
      const payloadB64 = base64UrlEncode(utf8Encode(payloadStr).buffer)
      const signingInput = `${headerB64}.${payloadB64}`

      const signature = await crypto.subtle.sign('HMAC', key, utf8Encode(signingInput))
      const signatureB64 = base64UrlEncode(signature)

      const token = `${signingInput}.${signatureB64}`
      setJwt(token)
      setDecodedHeader(headerStr)
      setDecodedPayload(JSON.stringify(JSON.parse(payloadStr), null, 2))
    } catch (e: any) {
      setError(`Error: ${e.message}`)
    }
  }, [header, payload, secret, algorithm])

  const copyToClipboard = useCallback(() => {
    if (jwt) {
      navigator.clipboard.writeText(jwt)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }, [jwt])

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium mb-1 text-[var(--color-text)]">Algorithm</label>
        <div className="flex gap-2">
          {ALGORITHMS.map((algo) => (
            <button
              key={algo}
              onClick={() => setAlgorithm(algo)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                algorithm === algo
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]'
              }`}
            >
              {algo}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-[var(--color-text)]">Header JSON</label>
        <textarea
          className="w-full h-24 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 font-mono text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-y"
          value={header}
          onChange={(e) => setHeader(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-[var(--color-text)]">Payload JSON</label>
        <textarea
          className="w-full h-32 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 font-mono text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-y"
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-[var(--color-text)]">Secret Key</label>
        <input
          type="text"
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 font-mono text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <button onClick={generate} className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-colors">
          Generate JWT
        </button>
        {jwt && (
          <button onClick={copyToClipboard} className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors">
            {copied ? 'Copied!' : 'Copy'}
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">
          {error}
        </div>
      )}

      {jwt && (
        <>
          <div>
            <label className="block text-sm font-medium mb-1 text-[var(--color-text)]">JWT Token</label>
            <textarea
              className="w-full h-20 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3 font-mono text-sm text-[var(--color-text)] resize-y"
              readOnly
              value={jwt}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-[var(--color-text)]">Decoded Header</label>
            <pre className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3 font-mono text-sm text-[var(--color-text)] overflow-x-auto">
              {decodedHeader}
            </pre>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-[var(--color-text)]">Decoded Payload</label>
            <pre className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3 font-mono text-sm text-[var(--color-text)] overflow-x-auto">
              {decodedPayload}
            </pre>
          </div>
        </>
      )}
    </div>
  )
}
