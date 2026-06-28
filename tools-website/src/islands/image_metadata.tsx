import { useState, useRef, useCallback, useEffect } from "react";

interface Metadata {
  name: string;
  size: number;
  type: string;
  width: number;
  height: number;
  lastModified: number;
}

export default function ImageMetadata() {
  const [meta, setMeta] = useState<Metadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    if (!f.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }
    setError("");
    setLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      setPreview(src);
      const img = new Image();
      img.onload = () => {
        setMeta({
          name: f.name,
          size: f.size,
          type: f.type,
          width: img.naturalWidth,
          height: img.naturalHeight,
          lastModified: f.lastModified,
        });
        setLoading(false);
      };
      img.onerror = () => {
        setError("Failed to read image dimensions.");
        setLoading(false);
      };
      img.src = src;
    };
    reader.readAsDataURL(f);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (ms: number) => new Date(ms).toLocaleString();

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); }}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-[var(--color-primary)]"
        style={{ borderColor: "var(--color-border)" }}
      >
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        {preview ? (
          <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded" />
        ) : (
          <p style={{ color: "var(--color-text-secondary)" }}>Drop an image here or click to select</p>
        )}
      </div>

      {error && (
        <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: "color-mix(in srgb, var(--color-error) 10%, transparent)", color: "var(--color-error)" }}>
          {error}
        </div>
      )}

      {loading && (
        <p className="text-sm text-center" style={{ color: "var(--color-text-secondary)" }}>Loading metadata...</p>
      )}

      {meta && !loading && (
        <div className="rounded-lg p-4 space-y-2" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
          <h3 className="text-sm font-medium" style={{ color: "var(--color-text)" }}>Image Metadata</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {([
              ["File Name", meta.name],
              ["File Size", formatSize(meta.size)],
              ["MIME Type", meta.type],
              ["Width", `${meta.width} px`],
              ["Height", `${meta.height} px`],
              ["Last Modified", formatDate(meta.lastModified)],
            ] as [string, string][]).map(([label, value]) => (
              <div key={label}>
                <span style={{ color: "var(--color-text-secondary)" }}>{label}: </span>
                <span style={{ color: "var(--color-text)" }} className="font-mono">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
