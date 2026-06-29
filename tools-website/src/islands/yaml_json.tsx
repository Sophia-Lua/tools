import { useState, useCallback } from 'react'
import { load as yamlLoad, dump as yamlDump } from 'js-yaml'

export default function YamlJson() {
  const [yamlText, setYamlText] = useState('')
  const [jsonText, setJsonText] = useState('')
  const [error, setError] = useState('')
  const [yamlCopied, setYamlCopied] = useState(false)
  const [jsonCopied, setJsonCopied] = useState(false)

  const yamlToJson = useCallback(() => {
    try {
      const parsed = yamlLoad(yamlText)
      const result = JSON.stringify(parsed, null, 2)
      setJsonText(result)
      setError('')
      setYamlCopied(false)
      setJsonCopied(false)
    } catch (e: any) {
      setError(`YAML Error: ${e.message}`)
      setJsonText('')
    }
  }, [yamlText])

  const jsonToYaml = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonText)
      const result = yamlDump(parsed, { indent: 2, lineWidth: 120 })
      setYamlText(result)
      setError('')
      setYamlCopied(false)
      setJsonCopied(false)
    } catch (e: any) {
      setError(`JSON Error: ${e.message}`)
      setYamlText('')
    }
  }, [jsonText])

  const copyYaml = useCallback(() => {
    if (yamlText) {
      navigator.clipboard.writeText(yamlText)
      setYamlCopied(true)
      setTimeout(() => setYamlCopied(false), 1500)
    }
  }, [yamlText])

  const copyJson = useCallback(() => {
    if (jsonText) {
      navigator.clipboard.writeText(jsonText)
      setJsonCopied(true)
      setTimeout(() => setJsonCopied(false), 1500)
    }
  }, [jsonText])

  const textareaClass = 'w-full h-72 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 font-mono text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-y'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--color-text)]">YAML</span>
            <button onClick={copyYaml} className="text-xs text-[var(--color-primary)] hover:underline">
              {yamlCopied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <textarea
            className={textareaClass}
            placeholder="Paste YAML here..."
            value={yamlText}
            onChange={(e) => setYamlText(e.target.value)}
          />
        </div>

        <div className="flex sm:flex-col items-center justify-center gap-2 py-2 sm:py-0">
          <button
            onClick={yamlToJson}
            className="rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--color-primary-hover)] transition-colors whitespace-nowrap"
          >
            YAML → JSON
          </button>
          <button
            onClick={jsonToYaml}
            className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors whitespace-nowrap"
          >
            JSON → YAML
          </button>
        </div>

        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--color-text)]">JSON</span>
            <button onClick={copyJson} className="text-xs text-[var(--color-primary)] hover:underline">
              {jsonCopied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <textarea
            className={textareaClass}
            placeholder='{"key": "value"}'
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-[var(--color-error)]/10 px-3 py-2 text-sm text-[var(--color-error)]">
          {error}
        </div>
      )}
    </div>
  )
}
