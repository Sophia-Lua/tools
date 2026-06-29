import { useState, useRef, useCallback } from "react";

type OutputFormat = "datauri" | "pure";

export default function ImageToBase64() {
  const [file, setFile] = useState<File | null>(null);
  const [base64, setBase64] = useState<string>("");
  const [format, setFormat] = useState<OutputFormat>("datauri");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    if (!f.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }
    setError("");
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (format === "datauri") {
        setBase64(result);
      } else {
        const pure = result.split(",")[1] || "";
        setBase64(pure);
      }
    };
    reader.readAsDataURL(f);
  }, [format]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleFormatChange = useCallback(
    (newFormat: OutputFormat) => {
      setFormat(newFormat);
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          if (newFormat === "datauri") {
            setBase64(result);
          } else {
            const pure = result.split(",")[1] || "";
            setBase64(pure);
          }
        };
        reader.readAsDataURL(file);
      }
    },
    [file]
  );

  const copyToClipboard = useCallback(() => {
    if (base64) {
      navigator.clipboard.writeText(base64);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [base64]);

  const download = useCallback(() => {
    if (!base64 || !file) return;
    const a = document.createElement("a");
    const blob = new Blob([base64], { type: "text/plain" });
    a.href = URL.createObjectURL(blob);
    a.download = `${file.name.replace(/\.[^.]+$/, "")}_base64.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [base64, file]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-[var(--color-primary)]"
        style={{ borderColor: "var(--color-border)" }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          style={{ display: "none" }}
          onChange={(e) => handleFiles(e.target.files)}
        />
        {file ? (
          <div>
            <p style={{ color: "var(--color-text)" }}>{file.name}</p>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              {formatSize(file.size)}
            </p>
          </div>
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
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
              Output Format
            </label>
            <select
              value={format}
              onChange={(e) => handleFormatChange(e.target.value as OutputFormat)}
              className="rounded-md px-3 py-1.5 text-sm border"
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text)",
              }}
            >
              <option value="datauri">Data URI (data:image/png;base64,...)</option>
              <option value="pure">Pure Base64</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Length: {base64.length} characters
            </span>
            <div className="flex gap-2">
              <button
                onClick={copyToClipboard}
                disabled={!base64}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={download}
                disabled={!base64}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: "var(--color-success)" }}
              >
                Download as .txt
              </button>
            </div>
          </div>
        </div>
      )}

      {base64 && (
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
            Base64 Output
          </label>
          <textarea
            className="w-full h-48 rounded-lg border p-3 font-mono text-xs resize-y"
            readOnly
            value={base64}
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "var(--color-surface)",
              color: "var(--color-text)",
            }}
          />
        </div>
      )}
    </div>
  );
}
