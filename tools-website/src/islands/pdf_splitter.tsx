import { useState, useRef, useCallback } from "react";

export default function PdfSplitter() {
  const [file, setFile] = useState<File | null>(null);
  const [pageRange, setPageRange] = useState("");
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [outputUrl, setOutputUrl] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    if (f.type !== "application/pdf") {
      setError("Please select a valid PDF file.");
      return;
    }
    setError("");
    setFile(f);
    setOutputUrl("");
    try {
      const { PDFDocument } = await import("pdf-lib");
      const bytes = await f.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      setPageCount(doc.getPageCount());
      setPageRange(`1-${doc.getPageCount()}`);
    } catch {
      setError("Failed to read PDF file.");
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const parsePages = useCallback((range: string, total: number): number[] => {
    const pages: number[] = [];
    const parts = range.split(",").map((s) => s.trim());
    for (const part of parts) {
      if (part.includes("-")) {
        const [start, end] = part.split("-").map(Number);
        for (let i = start; i <= Math.min(end, total); i++) {
          if (i >= 1 && i <= total) pages.push(i);
        }
      } else {
        const n = parseInt(part);
        if (n >= 1 && n <= total) pages.push(n);
      }
    }
    return [...new Set(pages)].sort((a, b) => a - b);
  }, []);

  const split = useCallback(async () => {
    if (!file || !pageRange) return;
    setLoading(true);
    setError("");
    try {
      const { PDFDocument } = await import("pdf-lib");
      const bytes = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(bytes);
      const total = srcDoc.getPageCount();
      const pages = parsePages(pageRange, total);
      if (pages.length === 0) {
        setError("No valid pages in range.");
        setLoading(false);
        return;
      }
      const newDoc = await PDFDocument.create();
      const copied = await newDoc.copyPages(srcDoc, pages.map((p) => p - 1));
      copied.forEach((page) => newDoc.addPage(page));
      const pdfBytes = await newDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
      if (outputUrl) URL.revokeObjectURL(outputUrl);
      setOutputUrl(URL.createObjectURL(blob));
    } catch (e) {
      setError(`Split failed: ${e instanceof Error ? e.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  }, [file, pageRange, parsePages, outputUrl]);

  const download = useCallback(() => {
    if (!outputUrl) return;
    const a = document.createElement("a");
    a.href = outputUrl;
    a.download = "split.pdf";
    a.click();
  }, [outputUrl]);

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); }}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-[var(--color-primary)]"
        style={{ borderColor: "var(--color-border)" }}
      >
        <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        {file ? (
          <p className="text-sm" style={{ color: "var(--color-text)" }}>{file.name} ({pageCount} pages)</p>
        ) : (
          <p style={{ color: "var(--color-text-secondary)" }}>Drop a PDF file here or click to select</p>
        )}
      </div>

      {error && (
        <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: "color-mix(in srgb, var(--color-error) 10%, transparent)", color: "var(--color-error)" }}>
          {error}
        </div>
      )}

      {file && (
        <div className="rounded-lg p-4 space-y-3" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
              Page range (e.g., 1-3, 5, 7-10)
            </label>
            <input
              type="text"
              value={pageRange}
              onChange={(e) => setPageRange(e.target.value)}
              placeholder={`1-${pageCount}`}
              className="rounded-md px-3 py-1.5 text-sm border w-full"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
            />
          </div>
          <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
            Total pages: {pageCount}
          </p>
          <button
            onClick={split}
            disabled={loading || !pageRange}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {loading ? "Splitting..." : "Split PDF"}
          </button>
        </div>
      )}

      {outputUrl && (
        <div className="rounded-lg p-4 space-y-3" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
          <p className="text-sm" style={{ color: "var(--color-success)" }}>PDF split successfully!</p>
          <button
            onClick={download}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: "var(--color-success)" }}
          >
            Download Split PDF
          </button>
        </div>
      )}
    </div>
  );
}
