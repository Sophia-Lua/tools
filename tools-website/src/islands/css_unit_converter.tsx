import { useState, useCallback, useMemo } from "react";

export default function CssUnitConverter() {
  const [px, setPx] = useState(16);
  const [baseFontSize, setBaseFontSize] = useState(16);
  const [viewportWidth, setViewportWidth] = useState(1920);
  const [copiedUnit, setCopiedUnit] = useState<string | null>(null);

  const conversions = useMemo(() => ({
    rem: (px / baseFontSize).toFixed(4).replace(/\.?0+$/, ""),
    em: (px / baseFontSize).toFixed(4).replace(/\.?0+$/, ""),
    vw: ((px / viewportWidth) * 100).toFixed(4).replace(/\.?0+$/, ""),
    percent: ((px / baseFontSize) * 100).toFixed(2).replace(/\.?0+$/, ""),
  }), [px, baseFontSize, viewportWidth]);

  const copyValue = useCallback((text: string, unit: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUnit(unit);
    setTimeout(() => setCopiedUnit(null), 2000);
  }, []);

  const inputStyle = {
    backgroundColor: "var(--color-surface)",
    borderColor: "var(--color-border)",
    color: "var(--color-text)",
  };

  const units = [
    { label: "rem", value: conversions.rem + "rem" },
    { label: "em", value: conversions.em + "em" },
    { label: "vw", value: conversions.vw + "vw" },
    { label: "%", value: conversions.percent + "%" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[140px]">
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
            Input (px)
          </label>
          <input
            type="number"
            className="w-full p-2 rounded-lg border text-sm font-mono"
            style={inputStyle}
            value={px}
            onChange={(e) => setPx(+e.target.value)}
          />
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
            Base font-size (px)
          </label>
          <input
            type="number"
            className="w-full p-2 rounded-lg border text-sm font-mono"
            style={inputStyle}
            value={baseFontSize}
            onChange={(e) => setBaseFontSize(+e.target.value)}
          />
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
            Viewport width (px)
          </label>
          <input
            type="number"
            className="w-full p-2 rounded-lg border text-sm font-mono"
            style={inputStyle}
            value={viewportWidth}
            onChange={(e) => setViewportWidth(+e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {units.map(({ label, value }) => (
          <div
            key={label}
            className="relative p-3 rounded-lg border"
            style={{
              backgroundColor: "var(--color-surface)",
              borderColor: "var(--color-border)",
            }}
          >
            <span className="text-xs font-medium" style={{ color: "var(--color-text-secondary, #888)" }}>
              {label}
            </span>
            <p className="text-lg font-mono font-bold mt-1" style={{ color: "var(--color-text)" }}>
              {value}
            </p>
            <button
              onClick={() => copyValue(value, label)}
              className="absolute top-2 right-2 px-2 py-0.5 rounded text-xs text-white"
              style={{ backgroundColor: copiedUnit === label ? "#22c55e" : "var(--color-primary)" }}
            >
              {copiedUnit === label ? "Copied" : "Copy"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
