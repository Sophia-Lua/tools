import { useState, useCallback, useMemo } from "react";

const BASES = [
  { label: "Binary", base: 2 },
  { label: "Octal", base: 8 },
  { label: "Decimal", base: 10 },
  { label: "Hex", base: 16 },
];

function parseValue(value: string, fromBase: number): bigint | null {
  try {
    return BigInt(parseInt(value, fromBase));
  } catch {
    return null;
  }
}

export default function NumberConverter() {
  const [input, setInput] = useState("42");
  const [fromBase, setFromBase] = useState(10);
  const [copiedBase, setCopiedBase] = useState<number | null>(null);

  const conversions = useMemo(() => {
    const val = parseValue(input, fromBase);
    if (val === null || val < 0n) return null;
    return BASES.map(({ label, base }) => ({
      label,
      base,
      value: val.toString(base).toUpperCase(),
    }));
  }, [input, fromBase]);

  const copyValue = useCallback((text: string, base: number) => {
    navigator.clipboard.writeText(text);
    setCopiedBase(base);
    setTimeout(() => setCopiedBase(null), 2000);
  }, []);

  const inputStyle = {
    backgroundColor: "var(--color-surface)",
    borderColor: "var(--color-border)",
    color: "var(--color-text)",
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
            Value
          </label>
          <input
            type="text"
            className="w-full p-2 rounded-lg border text-sm font-mono"
            style={inputStyle}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <div className="w-32">
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
            Base
          </label>
          <select
            className="w-full p-2 rounded-lg border text-sm"
            style={inputStyle}
            value={fromBase}
            onChange={(e) => setFromBase(+e.target.value)}
          >
            {Array.from({ length: 35 }, (_, i) => i + 2).map((b) => (
              <option key={b} value={b}>Base {b}</option>
            ))}
          </select>
        </div>
      </div>

      {!conversions && input && (
        <p className="text-sm" style={{ color: "var(--color-error, #ef4444)" }}>
          Invalid input for selected base
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {conversions?.map(({ label, base, value }) => (
          <div
            key={base}
            className="relative p-3 rounded-lg border"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <span className="text-xs font-medium" style={{ color: "var(--color-text-secondary, #888)" }}>
              {label} (base {base})
            </span>
            <p className="text-lg font-mono font-bold mt-1 break-all" style={{ color: "var(--color-text)" }}>
              {value}
            </p>
            <button
              onClick={() => copyValue(value, base)}
              className="absolute top-2 right-2 px-2 py-0.5 rounded text-xs text-white"
              style={{ backgroundColor: copiedBase === base ? "#22c55e" : "var(--color-primary)" }}
            >
              {copiedBase === base ? "Copied" : "Copy"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
