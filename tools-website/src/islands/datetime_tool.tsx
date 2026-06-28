import { useState, useCallback, useEffect } from "react";

function formatTimestamp(ts: number): string {
  return new Date(ts * 1000).toISOString().replace("T", " ").replace(/\.\d+Z$/, " UTC");
}

function parseDateToUnix(dateStr: string): number | null {
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : Math.floor(d.getTime() / 1000);
}

function formatDate(date: Date): string {
  return date.toISOString().replace("T", " ").replace(/\.\d+Z$/, " UTC");
}

export default function DatetimeTool() {
  const [now, setNow] = useState(new Date());
  const [timestampInput, setTimestampInput] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [convertedTimestamp, setConvertedTimestamp] = useState("");
  const [convertedDate, setConvertedDate] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const convertTimestamp = useCallback(() => {
    const ts = parseInt(timestampInput, 10);
    if (!isNaN(ts)) {
      setConvertedTimestamp(formatTimestamp(ts));
    }
  }, [timestampInput]);

  const convertDate = useCallback(() => {
    const ts = parseDateToUnix(dateInput);
    if (ts !== null) {
      setConvertedDate(ts.toString());
    }
  }, [dateInput]);

  const copyValue = useCallback((text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  const inputStyle = {
    backgroundColor: "var(--color-surface)",
    borderColor: "var(--color-border)",
    color: "var(--color-text)",
  };

  return (
    <div className="space-y-6">
      <div
        className="p-4 rounded-lg border text-center"
        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        <p className="text-xs mb-1" style={{ color: "var(--color-text-secondary, #888)" }}>Current Time</p>
        <p className="text-2xl font-mono font-bold" style={{ color: "var(--color-text)" }}>
          {formatDate(now)}
        </p>
        <p className="text-sm font-mono mt-1" style={{ color: "var(--color-text-secondary, #888)" }}>
          Unix: {Math.floor(now.getTime() / 1000)}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
            Unix Timestamp → Human Date
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              className="flex-1 p-2 rounded-lg border text-sm font-mono"
              style={inputStyle}
              value={timestampInput}
              onChange={(e) => setTimestampInput(e.target.value)}
              placeholder="e.g. 1700000000"
            />
            <button
              onClick={convertTimestamp}
              className="px-3 py-2 rounded-lg text-sm font-medium text-white"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Convert
            </button>
          </div>
          {convertedTimestamp && (
            <div className="relative mt-2">
              <p className="p-2 rounded border text-sm font-mono" style={{ ...inputStyle, borderColor: "var(--color-border)" }}>
                {convertedTimestamp}
              </p>
              <button
                onClick={() => copyValue(convertedTimestamp, "ts")}
                className="absolute top-1 right-1 px-2 py-0.5 rounded text-xs text-white"
                style={{ backgroundColor: copiedField === "ts" ? "#22c55e" : "var(--color-primary)" }}
              >
                {copiedField === "ts" ? "Copied" : "Copy"}
              </button>
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
            Human Date → Unix Timestamp
          </label>
          <div className="flex gap-2">
            <input
              type="datetime-local"
              className="flex-1 p-2 rounded-lg border text-sm"
              style={inputStyle}
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
            />
            <button
              onClick={convertDate}
              className="px-3 py-2 rounded-lg text-sm font-medium text-white"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Convert
            </button>
          </div>
          {convertedDate && (
            <div className="relative mt-2">
              <p className="p-2 rounded border text-sm font-mono" style={{ ...inputStyle, borderColor: "var(--color-border)" }}>
                {convertedDate}
              </p>
              <button
                onClick={() => copyValue(convertedDate, "date")}
                className="absolute top-1 right-1 px-2 py-0.5 rounded text-xs text-white"
                style={{ backgroundColor: copiedField === "date" ? "#22c55e" : "var(--color-primary)" }}
              >
                {copiedField === "date" ? "Copied" : "Copy"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
