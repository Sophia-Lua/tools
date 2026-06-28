import { useState, useRef, useCallback } from "react";

export default function DocxConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    const isDocx =
      f.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      f.name.endsWith(".docx");
    if (!isDocx) {
      setError("Please select a valid .docx file.");
      return;
    }
    setError("");
    setFile(f);
    setHtml("");
    setLoading(true);
    try {
      const mammoth = await import("mammoth");
      const arrayBuffer = await f.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      if (result.messages.length > 0) {
        setError(`Warnings: ${result.messages.map((m) => m.message).join(", ")}`);
      }
      setHtml(result.value);
    } catch (e) {
      setError(`Conversion failed: ${e instanceof Error ? e.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(html).catch(() => {
      setError("Failed to copy to clipboard.");
    });
  }, [html]);

  const downloadHtml = useCallback(() => {
    if (!html || !file) return;
    const blob = new Blob([`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${file.name}</title></head><body>${html}</body></html>`], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${file.name.replace(/\.[^.]+$/, "")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [html, file]);

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); }}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-[var(--color-primary)]"
        style={{ borderColor: "var(--color-border)" }}
      >
        <input ref={inputRef} type="file" accept=".docx" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        {file ? (
          <p className="text-sm" style={{ color: "var(--color-text)" }}>{file.name}</p>
        ) : (
          <p style={{ color: "var(--color-text-secondary)" }}>Drop a .docx file here or click to select</p>
        )}
      </div>

      {error && (
        <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: "color-mix(in srgb, var(--color-error) 10%, transparent)", color: "var(--color-error)" }}>
          {error}
        </div>
      )}

      {loading && (
        <p className="text-sm text-center" style={{ color: "var(--color-text-secondary)" }}>Converting document...</p>
      )}

      {html && (
        <div className="rounded-lg p-4 space-y-3" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
          <div className="flex gap-2">
            <button
              onClick={copyToClipboard}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Copy HTML
            </button>
            <button
              onClick={downloadHtml}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: "var(--color-success)" }}
            >
              Download HTML
            </button>
          </div>
          <div
            className="rounded-md p-4 text-sm overflow-auto max-h-96 border"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
          <details className="text-xs">
            <summary className="cursor-pointer" style={{ color: "var(--color-text-secondary)" }}>View raw HTML</summary>
            <pre className="mt-2 p-3 rounded-md overflow-auto max-h-48 text-xs" style={{ backgroundColor: "var(--color-bg-tertiary)", color: "var(--color-text)" }}>
              {html}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
