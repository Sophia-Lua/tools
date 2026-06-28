import { useState, useRef, useCallback } from "react";

type OutputFormat = "image/jpeg" | "image/png" | "image/webp";

export default function ImageCompressor() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [quality, setQuality] = useState(80);
  const [format, setFormat] = useState<OutputFormat>("image/jpeg");
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [compressedUrl, setCompressedUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    if (!f.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }
    setError("");
    setFile(f);
    setCompressedSize(null);
    setCompressedUrl("");
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const compress = useCallback(() => {
    if (!file || !preview) return;
    setLoading(true);
    setError("");
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setError("Compression failed. Try a different format.");
            setLoading(false);
            return;
          }
          setCompressedSize(blob.size);
          const url = URL.createObjectURL(blob);
          setCompressedUrl(url);
          setLoading(false);
        },
        format,
        quality / 100
      );
    };
    img.onerror = () => {
      setError("Failed to load image.");
      setLoading(false);
    };
    img.src = preview;
  }, [file, preview, format, quality]);

  const download = useCallback(() => {
    if (!compressedUrl || !file) return;
    const ext = format.split("/")[1];
    const a = document.createElement("a");
    a.href = compressedUrl;
    a.download = `compressed_${file.name.replace(/\.[^.]+$/, "")}.${ext}`;
    a.click();
  }, [compressedUrl, file, format]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-4">
      <canvas ref={canvasRef} className="hidden" />

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-[var(--color-primary)]"
        style={{ borderColor: "var(--color-border)" }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {preview ? (
          <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded" />
        ) : (
          <p style={{ color: "var(--color-text-secondary)" }}>
            Drop an image here or click to select
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: "color-mix(in srgb, var(--color-error) 10%, transparent)", color: "var(--color-error)" }}>
          {error}
        </div>
      )}

      {file && (
        <div className="space-y-3 rounded-lg p-4" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>Quality</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-32 accent-[var(--color-primary)]"
                />
                <span className="text-sm font-mono w-8" style={{ color: "var(--color-text)" }}>{quality}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as OutputFormat)}
                className="rounded-md px-3 py-1.5 text-sm border"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
              >
                <option value="image/jpeg">JPEG</option>
                <option value="image/png">PNG</option>
                <option value="image/webp">WebP</option>
              </select>
            </div>
          </div>

          <button
            onClick={compress}
            disabled={loading}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {loading ? "Compressing..." : "Compress"}
          </button>
        </div>
      )}

      {compressedSize !== null && file && (
        <div className="rounded-lg p-4 space-y-3" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
          <div className="flex justify-between text-sm" style={{ color: "var(--color-text)" }}>
            <span>Original: {formatSize(file.size)}</span>
            <span>Compressed: {formatSize(compressedSize)}</span>
          </div>
          <div className="flex justify-between text-sm font-medium" style={{ color: "var(--color-success)" }}>
            <span>Saved: {formatSize(file.size - compressedSize)}</span>
            <span>{((1 - compressedSize / file.size) * 100).toFixed(1)}% reduction</span>
          </div>
          <button
            onClick={download}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: "var(--color-success)" }}
          >
            Download Compressed Image
          </button>
        </div>
      )}
    </div>
  );
}
