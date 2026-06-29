import { useState, useMemo, useCallback } from "react"

function detectDelimiter(text: string): string {
  const firstLine = text.split("\n")[0]
  if (firstLine.includes("\t")) return "\t"
  if (firstLine.includes(";")) return ";"
  if (firstLine.includes("|")) return "|"
  return ","
}

function parseInput(text: string, delimiter: string): string[][] {
  return text
    .trim()
    .split("\n")
    .filter((l) => l.trim())
    .map((line) =>
      line.split(delimiter).map((cell) => cell.trim().replace(/^["']|["']$/g, ""))
    )
}

function toMarkdownTable(rows: string[][], aligns: string[]): string {
  if (rows.length === 0) return ""
  const headers = rows[0]
  const body = rows.slice(1)
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...body.map((r) => (r[i] || "").length))
  )

  const sep = (a: string) => {
    if (a === "left") return ":--"
    if (a === "right") return "--:"
    return ":-:"
  }

  const pad = (s: string, w: number) => s + " ".repeat(Math.max(0, w - s.length))

  const headerLine = "| " + headers.map((h, i) => pad(h, widths[i])).join(" | ") + " |"
  const sepLine =
    "| " + widths.map((w, i) => sep(aligns[i] || "left").padEnd(w, "-")).join(" | ") + " |"
  const bodyLines = body.map(
    (row) =>
      "| " +
      headers.map((_, i) => pad(row[i] || "", widths[i])).join(" | ") +
      " |"
  )

  return [headerLine, sepLine, ...bodyLines].join("\n")
}

function toHtmlTable(rows: string[][]): string {
  if (rows.length === 0) return ""
  const headers = rows[0]
  const body = rows.slice(1)
  let html = "<table>"
  html += "<thead><tr>"
  headers.forEach((h) => (html += `<th style="border:1px solid var(--color-border);padding:6px 10px;text-align:left">${h}</th>`))
  html += "</tr></thead>"
  html += "<tbody>"
  body.forEach((row) => {
    html += "<tr>"
    headers.forEach((_, i) => (html += `<td style="border:1px solid var(--color-border);padding:6px 10px">${row[i] || ""}</td>`))
    html += "</tr>"
  })
  html += "</tbody></table>"
  return html
}

export default function MarkdownTable() {
  const [input, setInput] = useState("Name,Age,City\nAlice,30,New York\nBob,25,San Francisco\nCharlie,35,Chicago")
  const [delimiter, setDelimiter] = useState(",")
  const [aligns, setAligns] = useState<string[]>([])
  const [copied, setCopied] = useState(false)

  const rows = useMemo(() => parseInput(input, delimiter), [input, delimiter])

  useMemo(() => {
    if (rows.length > 0 && aligns.length !== rows[0].length) {
      setAligns(rows[0].map(() => "left"))
    }
  }, [rows])

  const markdownTable = useMemo(() => toMarkdownTable(rows, aligns), [rows, aligns])
  const htmlTable = useMemo(() => toHtmlTable(rows), [rows])

  const autoDetect = useCallback(() => {
    const d = detectDelimiter(input)
    setDelimiter(d)
  }, [input])

  const setAlignment = useCallback((col: number, align: string) => {
    setAligns((prev) => {
      const next = [...prev]
      next[col] = align
      return next
    })
  }, [])

  const copyMarkdown = useCallback(async () => {
    await navigator.clipboard.writeText(markdownTable)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [markdownTable])

  const inputStyle = {
    backgroundColor: "var(--color-surface)",
    borderColor: "var(--color-border)",
    color: "var(--color-text)",
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">
          Input (CSV / Tab-separated)
        </label>
        <textarea
          className="w-full h-40 rounded-lg border bg-[var(--color-surface)] p-3 font-mono text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-y"
          style={{ borderColor: "var(--color-border)" }}
          placeholder="Paste CSV or tab-separated data..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-[var(--color-text-secondary)]">Delimiter:</label>
          <select
            value={delimiter}
            onChange={(e) => setDelimiter(e.target.value)}
            className="p-2 rounded-lg border text-sm"
            style={inputStyle}
          >
            <option value=",">, (Comma)</option>
            <option value="\t">Tab</option>
            <option value=";">; (Semicolon)</option>
            <option value="|">| (Pipe)</option>
          </select>
        </div>
        <button
          onClick={autoDetect}
          className="px-3 py-2 rounded-lg text-sm font-medium border"
          style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
        >
          Auto-detect
        </button>
        <button
          onClick={copyMarkdown}
          className="px-3 py-2 rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          {copied ? "Copied!" : "Copy Markdown"}
        </button>
      </div>

      {rows.length > 0 && rows[0].length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">
            Column Alignment
          </label>
          <div className="flex flex-wrap gap-2">
            {rows[0].map((col, i) => (
              <div key={i} className="flex items-center gap-1 text-xs">
                <span className="text-[var(--color-text-secondary)] truncate max-w-[80px]">{col}</span>
                <select
                  value={aligns[i] || "left"}
                  onChange={(e) => setAlignment(i, e.target.value)}
                  className="p-1 rounded border text-xs"
                  style={inputStyle}
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">Markdown Output</label>
        <pre
          className="w-full h-40 overflow-auto rounded-lg border bg-[var(--color-surface)] p-3 font-mono text-sm text-[var(--color-text)] whitespace-pre"
          style={{ borderColor: "var(--color-border)" }}
        >
          {markdownTable}
        </pre>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">HTML Preview</label>
        <div
          className="w-full overflow-auto rounded-lg border bg-[var(--color-surface)] p-3 text-sm text-[var(--color-text)]"
          style={{ borderColor: "var(--color-border)" }}
          dangerouslySetInnerHTML={{ __html: htmlTable }}
        />
      </div>
    </div>
  )
}
