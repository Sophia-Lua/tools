import { useState, useMemo } from 'react'

function camelCase(str: string): string {
  return str.replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
}

function typeOf(value: any): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

function jsonToTsInterface(
  obj: any,
  interfaceName: string,
  exportInterface: boolean,
  readonly: boolean,
  indent: number = 0
): string {
  const pad = '  '.repeat(indent)
  const prefix = readonly ? 'readonly ' : ''
  const exportPrefix = exportInterface ? 'export ' : ''
  const lines: string[] = []

  lines.push(`${pad}${exportPrefix}interface ${interfaceName} {`)

  for (const [key, value] of Object.entries(obj)) {
    const prop = camelCase(key)
    const tsType = getTsType(value, exportInterface, readonly, indent + 1, prop, interfaceName)
    lines.push(`${pad}  ${prefix}${prop}: ${tsType};`)
  }

  lines.push(`${pad}}`)
  return lines.join('\n')
}

function getTsType(
  value: any,
  exportInterface: boolean,
  readonly: boolean,
  indent: number,
  propName: string,
  parentName: string
): string {
  if (value === null) return 'null'

  if (Array.isArray(value)) {
    if (value.length === 0) return 'unknown[]'
    const first = value[0]
    if (first === null) return 'null[]'
    if (Array.isArray(first)) return 'unknown[][]'
    if (typeof first === 'object') {
      const nestedName = `${parentName}Item`
      return `${nestedName}[]`
    }
    return `${typeof first}[]`
  }

  if (typeof value === 'object') {
    const nestedName = `${parentName}`
    return nestedName
  }

  return typeof value
}

function collectNestedInterfaces(
  obj: any,
  interfaceName: string,
  exportInterface: boolean,
  readonly: boolean
): string[] {
  const result: string[] = []

  for (const [key, value] of Object.entries(obj)) {
    const prop = camelCase(key)
    const nestedName = `${interfaceName}${prop.charAt(0).toUpperCase() + prop.slice(1)}`

    if (Array.isArray(value)) {
      if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null && !Array.isArray(value[0])) {
        result.push(jsonToTsInterface(value[0], `${interfaceName}${prop.charAt(0).toUpperCase() + prop.slice(1)}Item`, exportInterface, readonly))
        result.push(...collectNestedInterfaces(value[0], `${interfaceName}${prop.charAt(0).toUpperCase() + prop.slice(1)}Item`, exportInterface, readonly))
      }
    } else if (typeof value === 'object' && value !== null) {
      result.push(jsonToTsInterface(value, nestedName, exportInterface, readonly))
      result.push(...collectNestedInterfaces(value, nestedName, exportInterface, readonly))
    }
  }

  return result
}

function generateTs(
  input: string,
  interfaceName: string,
  exportInterface: boolean,
  readonly: boolean
): string {
  const parsed = JSON.parse(input)
  const lines: string[] = []

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    if (Array.isArray(parsed)) {
      if (parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0] !== null) {
        const nestedInterfaces = collectNestedInterfaces(parsed[0], `${interfaceName}Item`, exportInterface, readonly)
        lines.push(...nestedInterfaces)
        lines.push('')
        lines.push(`${exportInterface ? 'export ' : ''}type ${interfaceName} = ${interfaceName}Item[]`)
      } else {
        const itemType = parsed.length > 0 ? (parsed[0] === null ? 'null' : typeof parsed[0]) : 'unknown'
        lines.push(`${exportInterface ? 'export ' : ''}type ${interfaceName} = ${itemType}[]`)
      }
    } else {
      lines.push(`${exportInterface ? 'export ' : ''}type ${interfaceName} = ${parsed === null ? 'null' : typeof parsed}`)
    }
    return lines.join('\n')
  }

  const nestedInterfaces = collectNestedInterfaces(parsed, interfaceName, exportInterface, readonly)
  lines.push(...nestedInterfaces)
  if (nestedInterfaces.length > 0) lines.push('')
  lines.push(jsonToTsInterface(parsed, interfaceName, exportInterface, readonly))

  return lines.join('\n')
}

export default function JsonToTs() {
  const [input, setInput] = useState('')
  const [interfaceName, setInterfaceName] = useState('Root')
  const [exportInterface, setExportInterface] = useState(true)
  const [readonly, setReadonly] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const output = useMemo(() => {
    if (!input.trim()) {
      setError('')
      return ''
    }
    try {
      const result = generateTs(input, interfaceName || 'Root', exportInterface, readonly)
      setError('')
      return result
    } catch (e: any) {
      setError(`Invalid JSON: ${e.message}`)
      return ''
    }
  }, [input, interfaceName, exportInterface, readonly])

  const copyToClipboard = () => {
    if (output) {
      navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-[var(--color-text)]">Interface Name:</label>
          <input
            type="text"
            value={interfaceName}
            onChange={(e) => setInterfaceName(e.target.value)}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-[var(--color-text)]">
          <input
            type="checkbox"
            checked={exportInterface}
            onChange={(e) => setExportInterface(e.target.checked)}
            className="rounded"
          />
          Export
        </label>
        <label className="flex items-center gap-2 text-sm text-[var(--color-text)]">
          <input
            type="checkbox"
            checked={readonly}
            onChange={(e) => setReadonly(e.target.checked)}
            className="rounded"
          />
          Readonly
        </label>
      </div>

      {error && (
        <div className="rounded-lg bg-[var(--color-error)]/10 px-3 py-2 text-sm text-[var(--color-error)]">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[var(--color-text)]">JSON Input</label>
          <textarea
            className="w-full h-64 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 font-mono text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-y"
            placeholder="Paste JSON here"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-[var(--color-text)]">TypeScript Output</label>
            {output && (
              <button
                onClick={copyToClipboard}
                className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] px-3 py-1 text-xs font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            )}
          </div>
          <textarea
            className="w-full h-64 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3 font-mono text-sm text-[var(--color-text)] resize-y"
            readOnly
            value={output}
          />
        </div>
      </div>
    </div>
  )
}
