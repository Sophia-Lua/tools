import { useState, useCallback } from 'react'

function formatXml(input: string): string {
  let formatted = ''
  let indent = 0
  const lines = input.replace(/>\s*</g, '>\n<').split('\n')

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue

    if (line.startsWith('</')) {
      indent--
    }

    formatted += `${'  '.repeat(Math.max(indent, 0))}${line}\n`

    if (line.startsWith('<') && !line.startsWith('</') && !line.startsWith('<?') && !line.endsWith('/>') && !/<\//.test(line)) {
      indent++
    }
  }

  return formatted.trimEnd()
}

function minifyXml(input: string): string {
  return input
    .replace(/>\s+</g, '><')
    .replace(/\n\s*/g, '')
    .trim()
}

function findErrorPosition(xml: string): string | null {
  let depth = 0
  let pos = 0
  const stack: string[] = []
  const tagOpenRe = /<\/?([a-zA-Z][\w\-.:]*)[^>]*>/g
  const selfClosingRe = /\/>/
  const closingRe = /^<\//
  let match: RegExpExecArray | null

  while ((match = tagOpenRe.exec(xml)) !== null) {
    const tag = match[0]
    const tagName = match[1]

    if (selfClosingRe.test(tag)) {
      pos = match.index + tag.length
      continue
    }

    if (closingRe.test(tag)) {
      if (stack.length === 0 || stack[stack.length - 1] !== tagName) {
        const line = xml.substring(0, match.index).split('\n').length
        const col = match.index - xml.lastIndexOf('\n', match.index - 1)
        return `Unexpected closing tag </${tagName}> at line ${line}, column ${col}`
      }
      stack.pop()
    } else {
      stack.push(tagName)
    }
    pos = match.index + tag.length
  }

  if (stack.length > 0) {
    return `Unclosed tag <${stack[stack.length - 1]}>`
  }

  return null
}

export default function XmlFormatter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const format = useCallback(() => {
    const err = findErrorPosition(input)
    if (err) {
      setError(err)
      setOutput('')
      return
    }
    try {
      setOutput(formatXml(input))
      setError('')
      setCopied(false)
    } catch (e: any) {
      setError(`Error: ${e.message}`)
      setOutput('')
    }
  }, [input])

  const minify = useCallback(() => {
    const err = findErrorPosition(input)
    if (err) {
      setError(err)
      setOutput('')
      return
    }
    try {
      setOutput(minifyXml(input))
      setError('')
      setCopied(false)
    } catch (e: any) {
      setError(`Error: ${e.message}`)
      setOutput('')
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
      <textarea
        className="w-full h-48 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 font-mono text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-y"
        placeholder="<root><item>value</item></root>"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <div className="flex gap-2">
        <button onClick={format} className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] transition-colors">
          Format
        </button>
        <button onClick={minify} className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors">
          Minify
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
