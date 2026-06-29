import { useState, useMemo, useCallback } from 'react'

interface Match {
  index: number
  length: number
  value: string
  groups: string[]
}

interface Token {
  type: 'literal' | 'quantifier' | 'group' | 'class' | 'anchor' | 'alternation' | 'escape'
  value: string
  description: string
}

function tokenizeRegex(pattern: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  while (i < pattern.length) {
    const ch = pattern[i]
    if (ch === '\\' && i + 1 < pattern.length) {
      const next = pattern[i + 1]
      const escapeMap: Record<string, string> = {
        d: 'Digit [0-9]',
        D: 'Non-digit',
        w: 'Word char [a-zA-Z0-9_]',
        W: 'Non-word char',
        s: 'Whitespace',
        S: 'Non-whitespace',
        b: 'Word boundary',
        B: 'Non-word boundary',
        n: 'Newline',
        t: 'Tab',
      }
      tokens.push({
        type: next in ['d', 'D', 'w', 'W', 's', 'S'] ? 'class' : next === 'b' || next === 'B' ? 'anchor' : 'escape',
        value: '\\' + next,
        description: escapeMap[next] || `Escaped "${next}"`,
      })
      i += 2
    } else if (ch === '(' || ch === ')') {
      tokens.push({ type: 'group', value: ch, description: ch === '(' ? 'Group start' : 'Group end' })
      i++
    } else if (ch === '[' || ch === ']') {
      let end = pattern.indexOf(']', i + 1)
      if (end === -1) end = pattern.length
      const content = pattern.slice(i, end + 1)
      tokens.push({ type: 'class', value: content, description: `Character class${content[1] === '^' ? ' (negated)' : ''}` })
      i = end + 1
    } else if (ch === '*' || ch === '+' || ch === '?') {
      tokens.push({ type: 'quantifier', value: ch, description: ch === '*' ? 'Zero or more' : ch === '+' ? 'One or more' : 'Optional' })
      i++
    } else if (ch === '{') {
      let end = pattern.indexOf('}', i + 1)
      if (end === -1) end = pattern.length
      const content = pattern.slice(i, end + 1)
      tokens.push({ type: 'quantifier', value: content, description: `Repeat ${content}` })
      i = end + 1
    } else if (ch === '^' || ch === '$') {
      tokens.push({ type: 'anchor', value: ch, description: ch === '^' ? 'Start of string' : 'End of string' })
      i++
    } else if (ch === '|') {
      tokens.push({ type: 'alternation', value: '|', description: 'OR' })
      i++
    } else if (ch === '.') {
      tokens.push({ type: 'class', value: '.', description: 'Any character' })
      i++
    } else {
      tokens.push({ type: 'literal', value: ch, description: `Literal "${ch}"` })
      i++
    }
  }
  return tokens
}

const TYPE_COLORS: Record<string, string> = {
  literal: 'bg-[var(--color-success)]/20 text-[var(--color-success)]',
  quantifier: 'bg-[var(--color-warning)]/20 text-[var(--color-warning)]',
  group: 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]',
  class: 'bg-[var(--color-error)]/20 text-[var(--color-error)]',
  anchor: 'bg-purple-500/20 text-purple-400',
  alternation: 'bg-cyan-500/20 text-cyan-400',
  escape: 'bg-orange-500/20 text-orange-400',
}

export default function RegexVisual() {
  const [pattern, setPattern] = useState('')
  const [flags, setFlags] = useState('g')
  const [testString, setTestString] = useState('')

  const flagString = flags

  const error = useMemo(() => {
    if (!pattern) return ''
    try { new RegExp(pattern, flagString); return '' }
    catch (e: any) { return e.message }
  }, [pattern, flagString])

  const matches = useMemo<Match[]>(() => {
    if (!pattern || !testString || error) return []
    try {
      const regex = new RegExp(pattern, flagString)
      const results: Match[] = []
      let match: RegExpExecArray | null
      if (flags.includes('g')) {
        while ((match = regex.exec(testString)) !== null) {
          results.push({
            index: match.index,
            length: match[0].length,
            value: match[0],
            groups: match.slice(1).map((g) => g ?? ''),
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
            groups: match.slice(1).map((g) => g ?? ''),
          })
        }
      }
      return results
    } catch {
      return []
    }
  }, [pattern, flagString, testString, error])

  const highlighted = useMemo(() => {
    if (!pattern || !testString || error || matches.length === 0) return null
    try {
      const regex = new RegExp(pattern, flagString)
      return testString.replace(
        regex,
        (m) => `<mark class="bg-[var(--color-warning)]/30 text-[var(--color-text)] rounded px-0.5">${m}</mark>`
      )
    } catch {
      return null
    }
  }, [pattern, flagString, testString, matches, error])

  const tokens = useMemo(() => tokenizeRegex(pattern), [pattern])

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[var(--color-text-secondary)]">Flags</label>
          <input
            type="text"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 font-mono text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            placeholder="g, i, m, s..."
            value={flags}
            onChange={(e) => setFlags(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-[var(--color-error)]/10 px-3 py-2 text-sm text-[var(--color-error)]">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-[var(--color-text-secondary)]">Test String</label>
        <textarea
          className="w-full h-24 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 font-mono text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-y"
          placeholder="Enter test string..."
          value={testString}
          onChange={(e) => setTestString(e.target.value)}
        />
      </div>

      {highlighted && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[var(--color-text-secondary)]">Highlighted Matches</label>
          <pre
            className="w-full min-h-[4rem] max-h-48 overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 font-mono text-sm whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </div>
      )}

      {matches.length > 0 && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[var(--color-text-secondary)]">
            {matches.length} match{matches.length !== 1 ? 'es' : ''}
          </label>
          {matches.map((m, i) => (
            <div key={i} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-[var(--color-primary)]">Match {i + 1}</span>
                <span className="text-[var(--color-text-secondary)]">at index {m.index}</span>
              </div>
              <code className="mt-1 block text-sm font-mono text-[var(--color-success)]">"{m.value}"</code>
              {m.groups.length > 0 && (
                <div className="mt-1 text-xs text-[var(--color-text-secondary)]">
                  Groups: {m.groups.map((g, j) => (
                    <span key={j} className="ml-1 rounded bg-[var(--color-bg-secondary)] px-1 py-0.5 font-mono">
                      {j + 1}: {g || '(empty)'}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tokens.length > 0 && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[var(--color-text-secondary)]">Pattern Structure</label>
          <div className="flex flex-wrap gap-1.5">
            {tokens.map((t, i) => (
              <span
                key={i}
                title={t.description}
                className={`inline-flex items-center rounded px-2 py-1 font-mono text-xs cursor-help ${TYPE_COLORS[t.type]}`}
              >
                {t.value}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mt-1">
            {Object.entries(TYPE_COLORS).filter(([k]) => tokens.some((t) => t.type === k)).map(([type, cls]) => (
              <span key={type} className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs ${cls}`}>
                <span className="w-2 h-2 rounded-full bg-current opacity-50" />
                {type}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
