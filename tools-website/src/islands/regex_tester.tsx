import { useState, useMemo, useCallback } from 'react'

interface Match {
  index: number
  length: number
  value: string
  groups?: string[]
}

export default function RegexTester() {
  const [pattern, setPattern] = useState('')
  const [flags, setFlags] = useState({ g: true, i: false, m: false, s: false })
  const [testString, setTestString] = useState('')
  const [copied, setCopied] = useState(false)

  const flagString = useMemo(() => {
    return Object.entries(flags)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join('')
  }, [flags])

  const matches = useMemo<Match[]>(() => {
    if (!pattern || !testString) return []
    try {
      const regex = new RegExp(pattern, flagString)
      const results: Match[] = []
      let match: RegExpExecArray | null
      if (flags.g) {
        while ((match = regex.exec(testString)) !== null) {
          results.push({
            index: match.index,
            length: match[0].length,
            value: match[0],
            groups: match.slice(1),
          })
          if (match[0].length === 0) break
        }
      } else {
        match = regex.exec(testString)
        if (match) {
          results.push({
            index: match.index,
            length: match[0].length,
            value: match[0],
            groups: match.slice(1),
          })
        }
      }
      return results
    } catch {
      return []
    }
  }, [pattern, flagString, testString, flags.g])

  const highlighted = useMemo(() => {
    if (!pattern || !testString || matches.length === 0) return testString
    try {
      const regex = new RegExp(pattern, flagString)
      return testString.replace(
        regex,
        (match) => `<mark class="bg-[var(--color-warning)]/30 text-[var(--color-text)] rounded px-0.5">${match}</mark>`
      )
    } catch {
      return testString
    }
  }, [pattern, flagString, testString, matches])

  const copyToClipboard = useCallback(() => {
    const text = matches
      .map((m, i) => `Match ${i + 1}: "${m.value}" at index ${m.index}${m.groups?.length ? ` Groups: [${m.groups.join(', ')}]` : ''}`)
      .join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [matches])

  const toggleFlag = (flag: keyof typeof flags) => {
    setFlags((prev) => ({ ...prev, [flag]: !prev[flag] }))
  }

  const error = pattern ? (() => { try { new RegExp(pattern); return '' } catch (e: any) { return e.message } })() : ''

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-[var(--color-text-secondary)]">Pattern</label>
        <input
          type="text"
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 font-mono text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          placeholder="Enter regex pattern..."
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
        />
      </div>

      {error && (
        <div className="rounded-lg bg-[var(--color-error)]/10 px-3 py-2 text-sm text-[var(--color-error)]">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {(['g', 'i', 'm', 's'] as const).map((flag) => (
          <label key={flag} className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={flags[flag]}
              onChange={() => toggleFlag(flag)}
              className="rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
            />
            <span className="text-sm font-mono text-[var(--color-text)]">{flag}</span>
          </label>
        ))}
      </div>

      <div>
        <label className="text-sm font-medium text-[var(--color-text-secondary)]">Test String</label>
        <textarea
          className="mt-1 w-full h-32 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 font-mono text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-y"
          placeholder="Enter test string..."
          value={testString}
          onChange={(e) => setTestString(e.target.value)}
        />
      </div>

      {matches.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">
            {matches.length} match{matches.length !== 1 ? 'es' : ''} found
          </span>
          <button onClick={copyToClipboard} className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors">
            {copied ? 'Copied!' : 'Copy Results'}
          </button>
        </div>
      )}

      {testString && pattern && (
        <pre
          className="w-full min-h-[4rem] max-h-48 overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 font-mono text-sm"
          dangerouslySetInnerHTML={{ __html: highlighted || testString }}
        />
      )}

      {matches.length > 0 && (
        <div className="space-y-2">
          {matches.map((match, i) => (
            <div key={i} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-[var(--color-primary)]">Match {i + 1}</span>
                <span className="text-[var(--color-text-secondary)]">at index {match.index}</span>
              </div>
              <code className="mt-1 block text-sm font-mono text-[var(--color-success)]">"{match.value}"</code>
              {match.groups && match.groups.length > 0 && (
                <div className="mt-1 text-xs text-[var(--color-text-secondary)]">
                  Groups: {match.groups.map((g, j) => (
                    <span key={j} className="ml-1 rounded bg-[var(--color-bg-secondary)] px-1 py-0.5 font-mono">
                      {j + 1}: {g ?? 'undefined'}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
