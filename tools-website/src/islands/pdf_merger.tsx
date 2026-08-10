import { useState, useCallback, useRef } from "react";

interface PdfFile {
  file: File;
  name: string;
  size: number;
}

export default function PdfMerger() {
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [outputUrl, setOutputUrl] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles) return;
    const pdfs: PdfFile[] = [];
    for (const f of Array.from(newFiles)) {
      if (f.type === "application/pdf") {
        pdfs.push({ file: f, name: f.name, size: f.size });
      }
    }
    if (pdfs.length === 0) {
      setError("Please select valid PDF files.");
      return;
    }
    setError("");
    setFiles((prev) => [...prev, ...pdfs]);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const moveFile = useCallback((from: number, to: number) => {
    if (to < 0 || to >= files.length) return;
    setFiles((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }, [files.length]);

  const merge = useCallback(async () => {
    if (files.length === 0) return;
    setLoading(true);
    setError("");
    try {
      const { PDFDocument } = await import("pdf-lib");
      const merged = await PDFDocument.create();
      for (const f of files) {
        const bytes = await f.file.arrayBuffer();
        const doc = await PDFDocument.load(bytes);
        const copied = await merged.copyPages(doc, doc.getPageIndices());
        copied.forEach((page) => merged.addPage(page));
      }
      const pdfBytes = await merged.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
      if (outputUrl) URL.revokeObjectURL(outputUrl);
      setOutputUrl(URL.createObjectURL(blob));
    } catch (e) {
      setError(`Merge failed: ${e instanceof Error ? e.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  }, [files, outputUrl]);

  const download = useCallback(() => {
    if (!outputUrl) return;
    const a = document.createElement("a");
    a.href = outputUrl;
    a.download = "merged.pdf";
    a.click();
  }, [outputUrl]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-4">
      <div
        onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
        onDragOver={(e) => { e.preventDefault(); }}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-[var(--color-primary)]"
        style={{ borderColor: "var(--color-border)" }}
      >
        <input ref={inputRef} type="file" accept=".pdf" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
        <p style={{ color: "var(--color-text-secondary)" }}>
          Drop PDF files here or click to select (multiple files allowed)
        </p>
      </div>

      {error && (
        <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: "color-mix(in srgb, var(--color-error) 10%, transparent)", color: "var(--color-error)" }}>
          {error}
        </div>
      )}

      {files.length > 0 && (
        <div className="rounded-lg p-4 space-y-2" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
          <p className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
            {files.length} file(s) — drag arrows to reorder
          </p>
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-2 rounded-md px-3 py-2" style={{ backgroundColor: "var(--color-surface)" }}>
              <button onClick={() => moveFile(i, i - 1)} disabled={i === 0} className="text-xs disabled:opacity-30" style={{ color: "var(--color-text-secondary)" }}>&#9650;</button>
              <button onClick={() => moveFile(i, i + 1)} disabled={i === files.length - 1} className="text-xs disabled:opacity-30" style={{ color: "var(--color-text-secondary)" }}>&#9660;</button>
              <span className="flex-1 text-sm truncate" style={{ color: "var(--color-text)" }}>{f.name}</span>
              <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>{formatSize(f.size)}</span>
              <button onClick={() => removeFile(i)} className="text-xs ml-2" style={{ color: "var(--color-error)" }}>Remove</button>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <button
          onClick={merge}
          disabled={loading}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          {loading ? "Merging..." : "Merge PDFs"}
        </button>
      )}

      {outputUrl && (
        <div className="rounded-lg p-4 space-y-3" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
          <p className="text-sm" style={{ color: "var(--color-success)" }}>PDF merged successfully!</p>
          <button
            onClick={download}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: "var(--color-success)" }}
          >
            Download Merged PDF
          </button>
        </div>
      )}
    </div>
  );
}
