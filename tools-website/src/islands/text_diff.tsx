import { useState, useMemo, useCallback } from 'react'

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged'
  content: string
  lineNum?: number
}

function computeDiff(a: string, b: string): DiffLine[] {
  const aLines = a.split('\n')
  const bLines = b.split('\n')
  const result: DiffLine[] = []

  const maxLen = Math.max(aLines.length, bLines.length)
  let aIdx = 0
  let bIdx = 0

  while (aIdx < aLines.length || bIdx < bLines.length) {
    if (aIdx < aLines.length && bIdx < bLines.length) {
      if (aLines[aIdx] === bLines[bIdx]) {
        result.push({ type: 'unchanged', content: aLines[aIdx], lineNum: bIdx + 1 })
        aIdx++
        bIdx++
      } else {
        let foundInB = -1
        for (let k = bIdx + 1; k < Math.min(bIdx + 20, bLines.length); k++) {
          if (bLines[k] === aLines[aIdx]) { foundInB = k; break }
        }
        let foundInA = -1
        for (let k = aIdx + 1; k < Math.min(aIdx + 20, aLines.length); k++) {
          if (aLines[k] === bLines[bIdx]) { foundInA = k; break }
        }

        if (foundInB >= 0 && (foundInA < 0 || foundInB - bIdx <= foundInA - aIdx)) {
          while (bIdx < foundInB) {
            result.push({ type: 'added', content: bLines[bIdx], lineNum: bIdx + 1 })
            bIdx++
          }
        } else if (foundInA >= 0) {
          while (aIdx < foundInA) {
            result.push({ type: 'removed', content: aLines[aIdx] })
            aIdx++
          }
        } else {
          result.push({ type: 'removed', content: aLines[aIdx] })
          result.push({ type: 'added', content: bLines[bIdx], lineNum: bIdx + 1 })
          aIdx++
          bIdx++
        }
      }
    } else if (aIdx < aLines.length) {
      result.push({ type: 'removed', content: aLines[aIdx] })
      aIdx++
    } else if (bIdx < bLines.length) {
      result.push({ type: 'added', content: bLines[bIdx], lineNum: bIdx + 1 })
      bIdx++
    }
  }

  return result
}

export default function TextDiff() {
  const [left, setLeft] = useState('')
  const [right, setRight] = useState('')
  const [diffResult, setDiffResult] = useState<DiffLine[] | null>(null)
  const [copied, setCopied] = useState(false)

  const compare = useCallback(() => {
    setDiffResult(computeDiff(left, right))
    setCopied(false)
  }, [left, right])

  const stats = useMemo(() => {
    if (!diffResult) return null
    const added = diffResult.filter((l) => l.type === 'added').length
    const removed = diffResult.filter((l) => l.type === 'removed').length
    return { added, removed }
  }, [diffResult])

  const copyToClipboard = useCallback(() => {
    if (diffResult) {
      const text = diffResult
        .map((l) => {
          if (l.type === 'added') return `+ ${l.content}`
          if (l.type === 'removed') return `- ${l.content}`
          return `  ${l.content}`
        })
        .join('\n')
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }, [diffResult])

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">Original</label>
          <textarea
            className="w-full h-48 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 font-mono text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-y"
            placeholder="Paste original text..."
            value={left}
            onChange={(e) => setLeft(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">Modified</label>
          <textarea
            className="w-full h-48 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 font-mono text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-y"
            placeholder="Paste modified text..."
            value={right}
            onChange={(e) => setRight(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={compare} className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] transition-colors">
          Compare
        </button>
        {diffResult && (
          <button onClick={copyToClipboard} className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors">
            {copied ? 'Copied!' : 'Copy Diff'}
          </button>
        )}
      </div>

      {stats && (
        <div className="flex gap-4 text-sm">
          <span className="text-[var(--color-success)]">+{stats.added} added</span>
          <span className="text-[var(--color-error)]">-{stats.removed} removed</span>
        </div>
      )}

      {diffResult && (
        <pre className="w-full max-h-96 overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 font-mono text-sm">
          {diffResult.map((line, i) => (
            <div
              key={i}
              className={`px-2 ${
                line.type === 'added'
                  ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
                  : line.type === 'removed'
                    ? 'bg-[var(--color-error)]/10 text-[var(--color-error)]'
                    : 'text-[var(--color-text-secondary)]'
              }`}
            >
              <span className="mr-2 inline-block w-4 text-right opacity-50">
                {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
              </span>
              {line.content || '\u00A0'}
            </div>
          ))}
        </pre>
      )}
    </div>
  )
}
