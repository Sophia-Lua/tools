import { useState, useRef, useCallback } from "react";

export default function XlsxConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [output, setOutput] = useState("");
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const [sheetName, setSheetName] = useState("");
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const workbookRef = useRef<any>(null);
  const xlsxRef = useRef<any>(null);

  const convertSheet = useCallback((wb: any, name: string, fmt: string) => {
    const XLSX = xlsxRef.current;
    if (!XLSX) return;
    const ws = wb.Sheets[name];
    if (fmt === "csv") {
      setOutput(XLSX.utils.sheet_to_csv(ws));
    } else {
      setOutput(JSON.stringify(XLSX.utils.sheet_to_json(ws), null, 2));
    }
  }, []);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    const isXlsx =
      f.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      f.name.endsWith(".xlsx") ||
      f.name.endsWith(".xls");
    if (!isXlsx) {
      setError("Please select a valid Excel file (.xlsx or .xls).");
      return;
    }
    setError("");
    setFile(f);
    setOutput("");
    setLoading(true);
    try {
      const XLSX = await import("xlsx");
      xlsxRef.current = XLSX;
      const arrayBuffer = await f.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: "array" });
      workbookRef.current = wb;
      setSheetNames(wb.SheetNames);
      const name = wb.SheetNames[0];
      setSheetName(name);
      convertSheet(wb, name, format);
    } catch (e) {
      setError(`Failed to parse file: ${e instanceof Error ? e.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  }, [format, convertSheet]);

  const handleSheetChange = useCallback((name: string) => {
    setSheetName(name);
    if (workbookRef.current) {
      convertSheet(workbookRef.current, name, format);
    }
  }, [format, convertSheet]);

  const handleFormatChange = useCallback((fmt: "csv" | "json") => {
    setFormat(fmt);
    if (workbookRef.current && sheetName) {
      convertSheet(workbookRef.current, sheetName, fmt);
    }
  }, [sheetName, convertSheet]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(output).catch(() => {
      setError("Failed to copy to clipboard.");
    });
  }, [output]);

  const downloadOutput = useCallback(() => {
    if (!output || !file) return;
    const ext = format === "csv" ? "csv" : "json";
    const mime = format === "csv" ? "text/csv" : "application/json";
    const blob = new Blob([output], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${file.name.replace(/\.[^.]+$/, "")}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [output, file, format]);

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); }}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-[var(--color-primary)]"
        style={{ borderColor: "var(--color-border)" }}
      >
        <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        {file ? (
          <p className="text-sm" style={{ color: "var(--color-text)" }}>{file.name}</p>
        ) : (
          <p style={{ color: "var(--color-text-secondary)" }}>Drop an Excel file here or click to select</p>
        )}
      </div>

      {error && (
        <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: "color-mix(in srgb, var(--color-error) 10%, transparent)", color: "var(--color-error)" }}>
          {error}
        </div>
      )}

      {loading && (
        <p className="text-sm text-center" style={{ color: "var(--color-text-secondary)" }}>Parsing spreadsheet...</p>
      )}

      {sheetNames.length > 0 && (
        <div className="rounded-lg p-4 space-y-3" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
          <div className="flex flex-wrap gap-4 items-end">
            {sheetNames.length > 1 && (
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>Sheet</label>
                <select
                  value={sheetName}
                  onChange={(e) => handleSheetChange(e.target.value)}
                  className="rounded-md px-3 py-1.5 text-sm border"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
                >
                  {sheetNames.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>Output format</label>
              <div className="flex gap-1">
                {(["csv", "json"] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => handleFormatChange(fmt)}
                    className="px-3 py-1.5 text-sm rounded-md border"
                    style={{
                      borderColor: format === fmt ? "var(--color-primary)" : "var(--color-border)",
                      backgroundColor: format === fmt ? "var(--color-primary)" : "var(--color-surface)",
                      color: format === fmt ? "white" : "var(--color-text)",
                    }}
                  >
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {output && (
        <div className="rounded-lg p-4 space-y-3" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
          <div className="flex gap-2">
            <button
              onClick={copyToClipboard}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Copy
            </button>
            <button
              onClick={downloadOutput}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: "var(--color-success)" }}
            >
              Download {format.toUpperCase()}
            </button>
          </div>
          <pre className="rounded-md p-3 text-xs overflow-auto max-h-96 border" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}>
            {output}
          </pre>
        </div>
      )}
    </div>
  );
}
