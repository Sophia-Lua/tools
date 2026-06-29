import { useState, useCallback, useRef, useEffect } from "react";

type OutputFormat = "png" | "jpeg" | "webp";

export default function Base64ToImage() {
  const [base64, setBase64] = useState("");
  const [format, setFormat] = useState<OutputFormat>("png");
  const [quality, setQuality] = useState(92);
  const [preview, setPreview] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [error, setError] = useState("");
  const imgRef = useRef<HTMLImageElement>(null);

  const inputStyle = {
    backgroundColor: "var(--color-surface)",
    borderColor: "var(--color-border)",
    color: "var(--color-text)",
  };

  const cleanBase64 = useCallback((val: string): string => {
    let cleaned = val.trim();
    if (cleaned.startsWith("data:image")) {
      const match = cleaned.match(/^data:image\/[a-z]+;base64,(.+)$/);
      if (match) cleaned = match[1];
    }
    return cleaned;
  }, []);

  const isValidBase64 = useCallback((str: string): boolean => {
    if (!str) return false;
    return /^[A-Za-z0-9+/=\s]+$/.test(str);
  }, []);

  const getDataUri = useCallback((b64: string, fmt: OutputFormat): string => {
    return `data:image/${fmt};base64,${b64}`;
  }, []);

  const handleBase64Change = useCallback((val: string) => {
    setBase64(val);
    setError("");
    setPreview(null);
    setDimensions(null);

    const cleaned = cleanBase64(val);
    if (!cleaned) return;

    if (!isValidBase64(cleaned)) {
      setError("Invalid Base64 string. Only A-Z, a-z, 0-9, +, /, = are allowed.");
      return;
    }

    try {
      const dataUri = getDataUri(cleaned, format);
      setPreview(dataUri);
    } catch {
      setError("Failed to create image preview.");
    }
  }, [format, cleanBase64, isValidBase64, getDataUri]);

  const handleFormatChange = useCallback((newFormat: OutputFormat) => {
    setFormat(newFormat);
    if (base64) {
      const cleaned = cleanBase64(base64);
      if (cleaned && isValidBase64(cleaned)) {
        try {
          const dataUri = getDataUri(cleaned, newFormat);
          setPreview(dataUri);
        } catch {
          setError("Failed to create image preview.");
        }
      }
    }
  }, [base64, cleanBase64, isValidBase64, getDataUri]);

  useEffect(() => {
    if (preview && imgRef.current) {
      const img = imgRef.current;
      const handleLoad = () => {
        setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        setError("");
      };
      const handleError = () => {
        setError("Invalid Base64 data for the selected format.");
        setDimensions(null);
      };
      img.onload = handleLoad;
      img.onerror = handleError;
      img.src = preview;
    }
  }, [preview]);

  const handleDownload = useCallback(() => {
    if (!preview) return;
    const link = document.createElement("a");
    link.href = preview;
    link.download = `image.${format}`;
    link.click();
  }, [preview, format]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
          Base64 Input
        </label>
        <textarea
          className="w-full h-32 rounded-lg border p-3 font-mono text-xs resize-y focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          style={inputStyle}
          placeholder="Paste Base64 string here..."
          value={base64}
          onChange={(e) => handleBase64Change(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
            Output Format
          </label>
          <div className="flex gap-1">
            {(["png", "jpeg", "webp"] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => handleFormatChange(fmt)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors"
                style={{
                  borderColor: format === fmt ? "var(--color-primary)" : "var(--color-border)",
                  color: format === fmt ? "var(--color-primary)" : "var(--color-text)",
                  backgroundColor: format === fmt ? "var(--color-bg-secondary)" : "transparent",
                }}
              >
                {fmt.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {(format === "jpeg" || format === "webp") && (
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
              Quality: {quality}
            </label>
            <input
              type="range"
              min={1}
              max={100}
              value={quality}
              onChange={(e) => setQuality(+e.target.value)}
              className="w-full accent-[var(--color-primary)]"
            />
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: "color-mix(in srgb, var(--color-error) 10%, transparent)", color: "var(--color-error)" }}>
          {error}
        </div>
      )}

      {preview && (
        <div className="rounded-lg border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-secondary)" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium" style={{ color: "var(--color-text)" }}>Preview</span>
            {dimensions && (
              <span className="text-xs font-mono" style={{ color: "var(--color-text-secondary)" }}>
                {dimensions.width} × {dimensions.height}
              </span>
            )}
          </div>
          <div className="flex justify-center p-4 rounded-lg" style={{ backgroundColor: "var(--color-surface)" }}>
            <img
              ref={imgRef}
              src={preview}
              alt="Preview"
              className="max-w-full max-h-64 object-contain rounded"
              style={{ imageRendering: format === "png" ? "pixelated" : "auto" }}
            />
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={handleDownload}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: "var(--color-success)" }}
            >
              Download as {format.toUpperCase()}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}