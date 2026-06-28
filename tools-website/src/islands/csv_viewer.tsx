import { useState, useRef, useCallback } from "react";

interface ParsedCSV {
  headers: string[];
  rows: string[][];
}

export default function CsvViewer() {
  const [data, setData] = useState<ParsedCSV | null>(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const parseCSV = useCallback((text: string): ParsedCSV => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
    if (lines.length === 0) return { headers: [], rows: [] };

    const parseRow = (line: string): string[] => {
      const cells: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQuotes) {
          if (ch === '"') {
            if (i + 1 < line.length && line[i + 1] === '"') {
              current += '"';
              i++;
            } else {
              inQuotes = false;
            }
          } else {
            current += ch;
          }
        } else {
          if (ch === '"') {
            inQuotes = true;
          } else if (ch === ",") {
            cells.push(current);
            current = "";
          } else {
            current += ch;
          }
        }
      }
      cells.push(current);
      return cells;
    };

    const headers = parseRow(lines[0]);
    const rows = lines.slice(1).map(parseRow);
    return { headers, rows };
  }, []);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    const isCSV =
      f.type === "text/csv" ||
      f.name.endsWith(".csv");
    if (!isCSV) {
      setError("Please select a valid CSV file.");
      return;
    }
    setError("");
    setLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const parsed = parseCSV(text);
      setData(parsed);
      setFileName(f.name);
      setLoading(false);
    };
    reader.onerror = () => {
      setError("Failed to read file.");
      setLoading(false);
    };
    reader.readAsText(f);
  }, [parseCSV]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const filteredRows = data
    ? data.rows.filter((row) =>
        searchTerm === "" ||
        row.some((cell) => cell.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : [];

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); }}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-[var(--color-primary)]"
        style={{ borderColor: "var(--color-border)" }}
      >
        <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        {fileName ? (
          <p className="text-sm" style={{ color: "var(--color-text)" }}>{fileName}</p>
        ) : (
          <p style={{ color: "var(--color-text-secondary)" }}>Drop a CSV file here or click to select</p>
        )}
      </div>

      {error && (
        <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: "color-mix(in srgb, var(--color-error) 10%, transparent)", color: "var(--color-error)" }}>
          {error}
        </div>
      )}

      {loading && (
        <p className="text-sm text-center" style={{ color: "var(--color-text-secondary)" }}>Reading CSV...</p>
      )}

      {data && (
        <div className="rounded-lg p-4 space-y-3" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div>
              <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                {data.headers.length} columns, {data.rows.length} rows
                {searchTerm && filteredRows.length !== data.rows.length && (
                  <> — showing {filteredRows.length} filtered</>
                )}
              </span>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="rounded-md px-3 py-1.5 text-sm border"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
            />
          </div>

          <div className="overflow-auto max-h-96 rounded-md border" style={{ borderColor: "var(--color-border)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "var(--color-bg-tertiary)" }}>
                  {data.headers.map((h, i) => (
                    <th key={i} className="px-3 py-2 text-left font-medium whitespace-nowrap" style={{ color: "var(--color-text)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, ri) => (
                  <tr key={ri} style={{ borderTop: "1px solid var(--color-border)" }}>
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-3 py-2 whitespace-nowrap" style={{ color: "var(--color-text)" }}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
