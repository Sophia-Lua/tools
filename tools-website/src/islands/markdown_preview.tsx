import { useState, useMemo } from 'react'

function parseMarkdown(md: string): string {
  let html = md
  // Code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="rounded-lg bg-[var(--color-bg-secondary)] p-3 my-2 overflow-x-auto"><code>$2</code></pre>')
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="rounded bg-[var(--color-bg-secondary)] px-1.5 py-0.5 text-sm">$1</code>')
  // Headers
  html = html.replace(/^######\s+(.+)$/gm, '<h6 class="text-sm font-semibold mt-4 mb-1">$1</h6>')
  html = html.replace(/^#####\s+(.+)$/gm, '<h5 class="text-base font-semibold mt-4 mb-1">$1</h5>')
  html = html.replace(/^####\s+(.+)$/gm, '<h4 class="text-lg font-semibold mt-4 mb-1">$1</h4>')
  html = html.replace(/^###\s+(.+)$/gm, '<h3 class="text-xl font-bold mt-4 mb-2">$1</h3>')
  html = html.replace(/^##\s+(.+)$/gm, '<h2 class="text-2xl font-bold mt-6 mb-2">$1</h2>')
  html = html.replace(/^#\s+(.+)$/gm, '<h1 class="text-3xl font-bold mt-6 mb-3">$1</h1>')
  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="text-[var(--color-primary)] underline hover:text-[var(--color-primary-hover)]" href="$2">$1</a>')
  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img class="max-w-full rounded-lg my-2" src="$2" alt="$1" />')
  // Unordered lists
  html = html.replace(/^[\*\-]\s+(.+)$/gm, '<li class="ml-4">$1</li>')
  html = html.replace(/((?:<li class="ml-4">.*<\/li>\n?)+)/g, '<ul class="list-disc my-2">$1</ul>')
  // Ordered lists
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li class="ml-4">$1</li>')
  // Blockquotes
  html = html.replace(/^>\s+(.+)$/gm, '<blockquote class="border-l-4 border-[var(--color-primary)] pl-4 my-2 text-[var(--color-text-secondary)] italic">$1</blockquote>')
  // Horizontal rules
  html = html.replace(/^---+$/gm, '<hr class="my-4 border-[var(--color-border)]" />')
  // Paragraphs
  html = html.replace(/\n\n/g, '</p><p class="my-2">')
  html = `<p>${html}</p>`
  // Line breaks
  html = html.replace(/\n/g, '<br />')
  return html
}

export default function MarkdownPreview() {
  const [input, setInput] = useState('# Hello World\n\nThis is **bold** and *italic* text.\n\n- Item 1\n- Item 2\n\n> A blockquote\n\n`inline code`')
  const [copied, setCopied] = useState(false)

  const preview = useMemo(() => parseMarkdown(input), [input])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(preview)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">Markdown</span>
          </div>
          <textarea
            className="w-full h-80 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 font-mono text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-y"
            placeholder="Write markdown here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">Preview</span>
            <button
              onClick={copyToClipboard}
              className="rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] px-2 py-1 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              {copied ? 'Copied!' : 'Copy HTML'}
            </button>
          </div>
          <div
            className="w-full h-80 overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-text)]"
            dangerouslySetInnerHTML={{ __html: preview }}
          />
        </div>
      </div>
    </div>
  )
}
