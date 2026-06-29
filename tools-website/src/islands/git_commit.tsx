import { useState, useCallback, useMemo } from 'react'

const TYPES = ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'perf', 'ci', 'build'] as const

type CommitType = (typeof TYPES)[number]

export default function GitCommit() {
  const [type, setType] = useState<CommitType>('feat')
  const [scope, setScope] = useState('')
  const [description, setDescription] = useState('')
  const [body, setBody] = useState('')
  const [breaking, setBreaking] = useState(false)
  const [breakingDesc, setBreakingDesc] = useState('')
  const [copied, setCopied] = useState(false)

  const message = useMemo(() => {
    const scopePart = scope.trim() ? `(${scope.trim()})` : ''
    let msg = `${type}${scopePart}: ${description.trim() || 'add feature'}`
    if (body.trim()) {
      msg += `\n\n${body.trim()}`
    }
    if (breaking) {
      msg += `\n\nBREAKING CHANGE: ${breakingDesc.trim() || 'update API'}`
    }
    return msg
  }, [type, scope, description, body, breaking, breakingDesc])

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [message])

  const previewLines = message.split('\n')

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-[var(--color-text-secondary)]">Type</label>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                type === t
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-[var(--color-text-secondary)]">Scope (optional)</label>
        <input
          type="text"
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 font-mono text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          placeholder="e.g. api, auth, ui"
          value={scope}
          onChange={(e) => setScope(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-[var(--color-text-secondary)]">Description *</label>
        <input
          type="text"
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 font-mono text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          placeholder="Short description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-[var(--color-text-secondary)]">Body (optional)</label>
        <textarea
          className="w-full h-24 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 font-mono text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-y"
          placeholder="Additional details..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm text-[var(--color-text)]">
          <input
            type="checkbox"
            checked={breaking}
            onChange={(e) => setBreaking(e.target.checked)}
            className="rounded"
          />
          Breaking Change
        </label>
        {breaking && (
          <input
            type="text"
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 font-mono text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            placeholder="Describe the breaking change..."
            value={breakingDesc}
            onChange={(e) => setBreakingDesc(e.target.value)}
          />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-[var(--color-text-secondary)]">Preview</label>
          <button onClick={copyToClipboard} className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors">
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <pre className="w-full min-h-[4rem] overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 font-mono text-sm text-[var(--color-text)] whitespace-pre-wrap">
          {previewLines.map((line, i) => {
            if (i === 0) {
              const scopeStart = line.indexOf('(')
              const colonIdx = line.indexOf(': ')
              if (scopeStart >= 0 && colonIdx > scopeStart) {
                const typePart = line.slice(0, scopeStart)
                const scopePart = line.slice(scopeStart, colonIdx)
                const descPart = line.slice(colonIdx)
                return (
                  <div key={i}>
                    <span className="text-[var(--color-success)]">{typePart}</span>
                    <span className="text-[var(--color-text-tertiary)]">{scopePart}</span>
                    <span className="text-[var(--color-text)]">{descPart}</span>
                  </div>
                )
              }
              const colonInLine = line.indexOf(': ')
              if (colonInLine >= 0) {
                return (
                  <div key={i}>
                    <span className="text-[var(--color-success)]">{line.slice(0, colonInLine)}</span>
                    <span className="text-[var(--color-text)]">{line.slice(colonInLine)}</span>
                  </div>
                )
              }
            }
            if (line.startsWith('BREAKING CHANGE:')) {
              return (
                <div key={i}>
                  <span className="text-[var(--color-error)] font-semibold">{line}</span>
                </div>
              )
            }
            return (
              <div key={i}>{line}</div>
            )
          })}
        </pre>
      </div>
    </div>
  )
}
