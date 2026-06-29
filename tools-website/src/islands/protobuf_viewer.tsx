import { useState, useCallback } from 'react'

interface ProtoField {
  name: string
  type: string
  number: number
  repeated: boolean
  optional: boolean
}

interface ProtoMessage {
  name: string
  fields: ProtoField[]
  enums: ProtoEnum[]
  messages: ProtoMessage[]
}

interface ProtoEnum {
  name: string
  values: { name: string; number: number }[]
}

function parseProto(input: string): { messages: ProtoMessage[]; enums: ProtoEnum[] } {
  const messages: ProtoMessage[] = []
  const enums: ProtoEnum[] = []

  const messageRe = /message\s+(\w+)\s*\{/g
  const enumRe = /enum\s+(\w+)\s*\{/g
  const fieldRe = /(repeated\s+|optional\s+)?(\w+)\s+(\w+)\s*=\s*(\d+)/g
  const enumValRe = /(\w+)\s*=\s*(\d+)/g
  const blockRe = /\{([^{}]*)\}/g

  let msgMatch: RegExpExecArray | null
  while ((msgMatch = messageRe.exec(input)) !== null) {
    const name = msgMatch[1]
    const startIdx = msgMatch.index + msgMatch[0].length
    const blockMatch = blockRe.exec(input.substring(startIdx - 1))
    if (!blockMatch) continue
    const body = blockMatch[1]

    const fields: ProtoField[] = []
    let fieldMatch: RegExpExecArray | null
    while ((fieldMatch = fieldRe.exec(body)) !== null) {
      fields.push({
        repeated: !!fieldMatch[1]?.includes('repeated'),
        optional: !!fieldMatch[1]?.includes('optional'),
        type: fieldMatch[2],
        name: fieldMatch[3],
        number: parseInt(fieldMatch[4]),
      })
    }
    messages.push({ name, fields, enums: [], messages: [] })
  }

  let enumMatch: RegExpExecArray | null
  while ((enumMatch = enumRe.exec(input)) !== null) {
    const name = enumMatch[1]
    const startIdx = enumMatch.index + enumMatch[0].length
    const blockMatch = blockRe.exec(input.substring(startIdx - 1))
    if (!blockMatch) continue
    const body = blockMatch[1]

    const values: { name: string; number: number }[] = []
    let valMatch: RegExpExecArray | null
    while ((valMatch = enumValRe.exec(body)) !== null) {
      values.push({ name: valMatch[1], number: parseInt(valMatch[2]) })
    }
    enums.push({ name, values })
  }

  return { messages, enums }
}

function TreeNode({ label, children, defaultOpen = true }: { label: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="ml-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-sm hover:opacity-80 text-left"
        style={{ color: 'var(--color-text)' }}
      >
        <span className="text-xs text-[var(--color-text-secondary)] w-4">{open ? '▼' : '▶'}</span>
        <span dangerouslySetInnerHTML={{ __html: label }} />
      </button>
      {open && <div className="border-l border-[var(--color-border)] ml-1 pl-2 mt-1">{children}</div>}
    </div>
  )
}

export default function ProtobufViewer() {
  const [input, setInput] = useState('')
  const [parsed, setParsed] = useState<{ messages: ProtoMessage[]; enums: ProtoEnum[] } | null>(null)
  const [error, setError] = useState('')

  const parse = useCallback(() => {
    try {
      const result = parseProto(input)
      if (result.messages.length === 0 && result.enums.length === 0) {
        setError('No messages or enums found')
        setParsed(null)
      } else {
        setParsed(result)
        setError('')
      }
    } catch (e: any) {
      setError(`Error: ${e.message}`)
      setParsed(null)
    }
  }, [input])

  const colorMap: Record<string, string> = {
    string: '#22c55e',
    int32: '#3b82f6',
    int64: '#3b82f6',
    uint32: '#3b82f6',
    uint64: '#3b82f6',
    float: '#a855f7',
    double: '#a855f7',
    bool: '#f59e0b',
    bytes: '#ef4444',
  }

  return (
    <div className="flex flex-col gap-4">
      <textarea
        className="w-full h-48 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 font-mono text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-y"
        placeholder={'message User {\n  string name = 1;\n  int32 age = 2;\n  repeated string emails = 3;\n}'}
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <button onClick={parse} className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] transition-colors self-start">
        Parse
      </button>

      {error && (
        <div className="rounded-lg bg-[var(--color-error)]/10 px-3 py-2 text-sm text-[var(--color-error)]">
          {error}
        </div>
      )}

      {parsed && (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 font-mono text-sm max-h-96 overflow-auto">
          {parsed.messages.map((msg) => (
            <TreeNode
              key={msg.name}
              defaultOpen={true}
              label={`<span style="color:#3b82f6">message</span> <span style="color:#f59e0b;font-weight:bold">${msg.name}</span> {${msg.fields.length} fields}`}
            >
              {msg.fields.map((f) => (
                <div key={f.name} className="py-0.5 text-sm flex items-center gap-2">
                  {f.repeated && <span className="text-xs text-[var(--color-text-secondary)]">repeated</span>}
                  {f.optional && <span className="text-xs text-[var(--color-text-secondary)]">optional</span>}
                  <span style={{ color: colorMap[f.type] || '#a855f7' }}>{f.type}</span>
                  <span style={{ color: 'var(--color-text)' }}>{f.name}</span>
                  <span className="text-[var(--color-text-secondary)]">= {f.number}</span>
                </div>
              ))}
            </TreeNode>
          ))}

          {parsed.enums.map((en) => (
            <TreeNode
              key={en.name}
              defaultOpen={false}
              label={`<span style="color:#ef4444">enum</span> <span style="color:#f59e0b;font-weight:bold">${en.name}</span> {${en.values.length} values}`}
            >
              {en.values.map((v) => (
                <div key={v.name} className="py-0.5 text-sm">
                  <span style={{ color: 'var(--color-text)' }}>{v.name}</span>
                  <span className="text-[var(--color-text-secondary)]"> = {v.number}</span>
                </div>
              ))}
            </TreeNode>
          ))}
        </div>
      )}
    </div>
  )
}
