import { useState, useCallback, useEffect } from 'react'

interface ClipboardItem {
  id: string
  text: string
  timestamp: number
}

const STORAGE_KEY = 'clipboard_history'
const MAX_ITEMS = 20
const EXPIRY_MS = 24 * 60 * 60 * 1000

function loadHistory(): ClipboardItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const items: ClipboardItem[] = JSON.parse(raw)
    const now = Date.now()
    return items.filter((item) => now - item.timestamp < EXPIRY_MS)
  } catch {
    return []
  }
}

function saveHistory(items: ClipboardItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // ignore
  }
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const diff = now.getTime() - ts
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString()
}

export default function ClipboardHistory() {
  const [items, setItems] = useState<ClipboardItem[]>([])
  const [copiedId, setCopiedId] = useState('')
  const [manualInput, setManualInput] = useState('')
  const [listening, setListening] = useState(false)

  useEffect(() => {
    setItems(loadHistory())
  }, [])

  useEffect(() => {
    saveHistory(items)
  }, [items])

  useEffect(() => {
    if (!listening) return
    const handler = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData('text/plain')
      if (text && text.trim()) {
        addItem(text.trim())
      }
    }
    document.addEventListener('paste', handler)
    return () => document.removeEventListener('paste', handler)
  }, [listening])

  const addItem = useCallback((text: string) => {
    setItems((prev) => {
      const filtered = prev.filter((item) => item.text !== text)
      const newItem: ClipboardItem = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        text,
        timestamp: Date.now(),
      }
      return [newItem, ...filtered].slice(0, MAX_ITEMS)
    })
  }, [])

  const addManual = useCallback(() => {
    const text = manualInput.trim()
    if (text) {
      addItem(text)
      setManualInput('')
    }
  }, [manualInput, addItem])

  const copyItem = useCallback((item: ClipboardItem) => {
    navigator.clipboard.writeText(item.text)
    setCopiedId(item.id)
    setTimeout(() => setCopiedId(''), 1500)
  }, [])

  const deleteItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setItems([])
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-[var(--color-text)]">
          <input
            type="checkbox"
            checked={listening}
            onChange={(e) => setListening(e.target.checked)}
            className="rounded"
          />
          Listen to clipboard paste
        </label>
        {items.length > 0 && (
          <button onClick={clearAll} className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-colors">
            Clear All
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          placeholder="Paste or type text to add..."
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addManual()}
        />
        <button onClick={addManual} className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] transition-colors">
          Add
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
          <p className="text-sm text-[var(--color-text-tertiary)]">No clipboard items yet. Paste text or type to add.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div key={item.id} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[var(--color-text-tertiary)]">{formatTime(item.timestamp)}</span>
                <div className="flex gap-1">
                  <button onClick={() => copyItem(item)} className="rounded px-2 py-0.5 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors">
                    {copiedId === item.id ? 'Copied!' : 'Copy'}
                  </button>
                  <button onClick={() => deleteItem(item.id)} className="rounded px-2 py-0.5 text-xs text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-colors">
                    Delete
                  </button>
                </div>
              </div>
              <p className="font-mono text-sm text-[var(--color-text)] break-all line-clamp-3">{item.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
