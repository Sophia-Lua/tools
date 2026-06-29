import { useState, useCallback } from 'react'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const DECODE_MAP: Record<string, number> = {}
ALPHABET.split('').forEach((ch, i) => (DECODE_MAP[ch] = i))

function encodeBase32(bytes: Uint8Array): string {
  let bits = 0
  let value = 0
  let output = ''
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i]
    bits += 8
    while (bits >= 5) {
      output += ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) {
    output += ALPHABET[(value << (5 - bits)) & 31]
  }
  return output
}

function decodeBase32(str: string): Uint8Array {
  const cleaned = str.replace(/[\s=]/g, '').toUpperCase()
  let bits = 0
  let value = 0
  const output: number[] = []
  for (const ch of cleaned) {
    const code = DECODE_MAP[ch]
    if (code === undefined) throw new Error(`Invalid Base32 character: ${ch}`)
    value = (value << 5) | code
    bits += 5
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255)
      bits -= 8
    }
  }
  return new Uint8Array(output)
}

export default function Base32Codec() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const copyToClipboard = useCallback(() => {
    if (output) {
      navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }, [output])

  const process = useCallback(() => {
    try {
      if (mode === 'encode') {
        const bytes = new TextEncoder().encode(input)
        setOutput(encodeBase32(bytes))
      } else {
        const bytes = decodeBase32(input)
        setOutput(new TextDecoder('utf-8').decode(bytes))
      }
      setError('')
      setCopied(false)
    } catch (e: any) {
      setError(`Error: ${e.message}`)
      setOutput('')
    }
  }, [input, mode])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <button
          onClick={() => setMode('encode')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            mode === 'encode'
              ? 'bg-[var(--color-primary)] text-white'
              : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]'
          }`}
        >
          Encode
        </button>
        <button
          onClick={() => setMode('decode')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            mode === 'decode'
              ? 'bg-[var(--color-primary)] text-white'
              : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]'
          }`}
        >
          Decode
        </button>
      </div>

      <textarea
        className="w-full h-32 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 font-mono text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-y"
        placeholder={mode === 'encode' ? 'Text to encode...' : 'Base32 to decode...'}
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <div className="flex gap-2">
        <button onClick={process} className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-colors">
          {mode === 'encode' ? 'Encode' : 'Decode'}
        </button>
        {output && (
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

      {output && (
        <textarea
          className="w-full h-32 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3 font-mono text-sm text-[var(--color-text)] resize-y"
          readOnly
          value={output}
        />
      )}
    </div>
  )
}
