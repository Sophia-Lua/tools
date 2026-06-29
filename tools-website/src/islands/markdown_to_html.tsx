import { useState, useMemo, useCallback } from "react"

function markdownToHtml(md: string): string {
  let html = md

  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
  html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>')
  html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>')
  html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>')
  html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  html = html.replace(/^[\-\*]\s+(.+)$/gm, '<li>$1</li>')
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>')
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
  html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>')
  html = html.replace(/^---+$/gm, '<hr />')
  html = html.replace(/\n\n/g, '</p><p>')
  html = `<p>${html}</p>`
  html = html.replace(/\n/g, '<br />')
  return html
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

export default function MarkdownToHtml() {
  const [input, setInput] = useState("# Hello World\n\nThis is **bold** and *italic* text.\n\n```js\nconst x = 1;\n```\n\n- Item 1\n- Item 2\n\n> Blockquote\n\n[Link](https://example.com)\n\n![Image](https://via.placeholder.com/100)")
  const [copied, setCopied] = useState(false)

  const preview = useMemo(() => markdownToHtml(input), [input])
  const rawHtml = useMemo(() => markdownToHtml(input), [input])
  const escapedHtml = useMemo(() => escapeHtml(rawHtml), [rawHtml])

  const copyHtml = useCallback(async () => {
    await navigator.clipboard.writeText(rawHtml)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [rawHtml])

  const inputStyle = {
    backgroundColor: "var(--color-surface)",
    borderColor: "var(--color-border)",
    color: "var(--color-text)",
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">Markdown</span>
          </div>
          <textarea
            className="w-full h-80 rounded-lg border bg-[var(--color-surface)] p-3 font-mono text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-y"
            style={{ borderColor: "var(--color-border)" }}
            placeholder="Write markdown..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">HTML Output</span>
            <button
              onClick={copyHtml}
              className="rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] px-2 py-1 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              {copied ? "Copied!" : "Copy HTML"}
            </button>
          </div>
          <textarea
            className="w-full h-80 rounded-lg border bg-[var(--color-surface)] p-3 font-mono text-sm text-[var(--color-text)] resize-y"
            style={{ borderColor: "var(--color-border)" }}
            readOnly
            value={escapedHtml}
          />
        </div>
      </div>

      <div>
        <div className="mb-2">
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">Live Preview</span>
        </div>
        <div
          className="w-full min-h-[200px] rounded-lg border bg-[var(--color-surface)] p-4 text-sm text-[var(--color-text)] prose prose-sm max-w-none"
          style={{ borderColor: "var(--color-border)" }}
          dangerouslySetInnerHTML={{ __html: preview }}
        />
      </div>
    </div>
  )
}
