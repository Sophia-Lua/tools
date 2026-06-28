import { useState, useRef, useCallback } from "react";

interface ArchiveEntry {
  name: string;
  size: number;
  compressedSize: number;
}

export default function ZipViewer() {
  const [entries, setEntries] = useState<ArchiveEntry[]>([]);
  const [totalSize, setTotalSize] = useState(0);
  const [totalCompressed, setTotalCompressed] = useState(0);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    const isZip =
      f.type === "application/zip" ||
      f.type === "application/x-zip-compressed" ||
      f.name.endsWith(".zip");
    if (!isZip) {
      setError("Please select a valid .zip file.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const fflate = await import("fflate");
      const buffer = await f.arrayBuffer();
      const data = new Uint8Array(buffer);
      const files = fflate.unzipSync(data);
      const result: ArchiveEntry[] = [];
      let totalOrig = 0;
      let totalComp = 0;
      for (const [name, compressed] of Object.entries(files)) {
        const origSize = compressed.length;
        totalOrig += origSize;
        result.push({
          name,
          size: origSize,
          compressedSize: 0,
        });
      }
      setEntries(result);
      setTotalSize(totalOrig);
      setTotalCompressed(0);
      setFileName(f.name);
    } catch (e) {
      setError(`Failed to read archive: ${e instanceof Error ? e.message : "Unknown error"}`);
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

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const dirs = entries.filter((e) => e.name.endsWith("/"));
  const files = entries.filter((e) => !e.name.endsWith("/"));

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); }}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-[var(--color-primary)]"
        style={{ borderColor: "var(--color-border)" }}
      >
        <input ref={inputRef} type="file" accept=".zip" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        {fileName ? (
          <p className="text-sm" style={{ color: "var(--color-text)" }}>{fileName}</p>
        ) : (
          <p style={{ color: "var(--color-text-secondary)" }}>Drop a ZIP file here or click to select</p>
        )}
      </div>

      {error && (
        <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: "color-mix(in srgb, var(--color-error) 10%, transparent)", color: "var(--color-error)" }}>
          {error}
        </div>
      )}

      {loading && (
        <p className="text-sm text-center" style={{ color: "var(--color-text-secondary)" }}>Reading archive...</p>
      )}

      {entries.length > 0 && (
        <div className="rounded-lg p-4 space-y-3" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
          <div className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            <span>{files.length} file(s), {dirs.length} folder(s)</span>
            {totalSize > 0 && (
              <span className="ml-2">— Total size: {formatSize(totalSize)}</span>
            )}
          </div>

          <div className="overflow-auto max-h-96 rounded-md border divide-y" style={{ borderColor: "var(--color-border)" }}>
            {dirs.map((entry) => (
              <div
                key={entry.name}
                className="flex items-center gap-2 px-3 py-2 text-sm"
                style={{ backgroundColor: "var(--color-bg-tertiary)" }}
              >
                <span className="opacity-60">&#128193;</span>
                <span className="flex-1 font-mono" style={{ color: "var(--color-text)" }}>{entry.name}</span>
              </div>
            ))}
            {files.map((entry) => (
              <div
                key={entry.name}
                className="flex items-center gap-2 px-3 py-2 text-sm"
                style={{ backgroundColor: "var(--color-surface)" }}
              >
                <span className="opacity-60">&#128196;</span>
                <span className="flex-1 font-mono truncate" style={{ color: "var(--color-text)" }}>{entry.name}</span>
                <span className="text-xs whitespace-nowrap" style={{ color: "var(--color-text-tertiary)" }}>
                  {formatSize(entry.size)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
