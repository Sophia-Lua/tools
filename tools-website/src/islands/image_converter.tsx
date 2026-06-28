import { useState, useRef, useCallback } from "react";

type OutputFormat = "image/png" | "image/jpeg" | "image/webp" | "image/bmp";

const EXT_MAP: Record<OutputFormat, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/bmp": "bmp",
};

export default function ImageConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [format, setFormat] = useState<OutputFormat>("image/png");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [outputUrl, setOutputUrl] = useState<string>("");
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
    setOutputUrl("");
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const convert = useCallback(() => {
    if (!preview) return;
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
      canvas.toBlob((blob) => {
        if (!blob) {
          setError("Conversion failed. Try a different format.");
          setLoading(false);
          return;
        }
        if (outputUrl) URL.revokeObjectURL(outputUrl);
        setOutputUrl(URL.createObjectURL(blob));
        setLoading(false);
      }, format);
    };
    img.onerror = () => {
      setError("Failed to load image.");
      setLoading(false);
    };
    img.src = preview;
  }, [preview, format, outputUrl]);

  const download = useCallback(() => {
    if (!outputUrl || !file) return;
    const a = document.createElement("a");
    a.href = outputUrl;
    a.download = `${file.name.replace(/\.[^.]+$/, "")}.${EXT_MAP[format]}`;
    a.click();
  }, [outputUrl, file, format]);

  return (
    <div className="space-y-4">
      <canvas ref={canvasRef} className="hidden" />

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

      {file && (
        <div className="space-y-3 rounded-lg p-4" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>Convert to</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as OutputFormat)}
              className="rounded-md px-3 py-1.5 text-sm border"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
            >
              <option value="image/png">PNG</option>
              <option value="image/jpeg">JPEG</option>
              <option value="image/webp">WebP</option>
              <option value="image/bmp">BMP</option>
            </select>
          </div>
          <button
            onClick={convert}
            disabled={loading}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {loading ? "Converting..." : "Convert"}
          </button>
        </div>
      )}

      {outputUrl && (
        <div className="rounded-lg p-4 space-y-3" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
          <img src={outputUrl} alt="Converted" className="max-h-48 mx-auto rounded" />
          <button
            onClick={download}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: "var(--color-success)" }}
          >
            Download Converted Image
          </button>
        </div>
      )}
    </div>
  );
}
