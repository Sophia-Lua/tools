import { useState, useCallback } from "react";

function generateUUIDv4(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("").replace(
    /(.{8})(.{4})(.{4})(.{4})(.{12})/,
    "$1-$2-$3-$4-$5"
  );
}

export default function UuidGenerator() {
  const [count, setCount] = useState(1);
  const [uuids, setUuids] = useState<string[]>([]);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const generate = useCallback(() => {
    setUuids(Array.from({ length: count }, () => generateUUIDv4()));
    setCopiedAll(false);
  }, [count]);

  const copyAll = useCallback(() => {
    navigator.clipboard.writeText(uuids.join("\n"));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  }, [uuids]);

  const copySingle = useCallback((uuid: string) => {
    navigator.clipboard.writeText(uuid);
    setCopiedId(uuid);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const inputStyle = {
    backgroundColor: "var(--color-surface)",
    borderColor: "var(--color-border)",
    color: "var(--color-text)",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="w-24">
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
            Count
          </label>
          <input
            type="number"
            min={1}
            max={100}
            className="w-full p-2 rounded-lg border text-sm font-mono"
            style={inputStyle}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(100, +e.target.value)))}
          />
        </div>
        <button
          onClick={generate}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          Generate
        </button>
        {uuids.length > 0 && (
          <button
            onClick={copyAll}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: copiedAll ? "#22c55e" : "var(--color-primary)" }}
          >
            {copiedAll ? "Copied!" : "Copy All"}
          </button>
        )}
      </div>
      {uuids.length > 0 && (
        <div
          className="max-h-80 overflow-y-auto rounded-lg border"
          style={{ borderColor: "var(--color-border)" }}
        >
          {uuids.map((uuid) => (
            <div
              key={uuid}
              className="flex items-center justify-between px-3 py-2 border-b last:border-b-0"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
            >
              <code className="text-sm font-mono" style={{ color: "var(--color-text)" }}>
                {uuid}
              </code>
              <button
                onClick={() => copySingle(uuid)}
                className="px-2 py-0.5 rounded text-xs text-white shrink-0 ml-2"
                style={{ backgroundColor: copiedId === uuid ? "#22c55e" : "var(--color-primary)" }}
              >
                {copiedId === uuid ? "Copied" : "Copy"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
