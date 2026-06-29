import { useState, useCallback } from "react";

interface Shadow {
  hOffset: number;
  vOffset: number;
  blur: number;
  spread: number;
  color: string;
  inset: boolean;
}

function shadowToCSS(s: Shadow): string {
  const insetStr = s.inset ? "inset " : "";
  return `${insetStr}${s.hOffset}px ${s.vOffset}px ${s.blur}px ${s.spread}px ${s.color}`;
}

export default function BoxShadow() {
  const [shadows, setShadows] = useState<Shadow[]>([
    { hOffset: 0, vOffset: 4, blur: 6, spread: 0, color: "rgba(0,0,0,0.1)", inset: false },
  ]);
  const [copied, setCopied] = useState(false);

  const updateShadow = useCallback((index: number, field: keyof Shadow, value: number | string | boolean) => {
    setShadows((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  }, []);

  const addShadow = useCallback(() => {
    setShadows((prev) => [...prev, { hOffset: 0, vOffset: 2, blur: 4, spread: 0, color: "rgba(0,0,0,0.15)", inset: false }]);
  }, []);

  const removeShadow = useCallback((index: number) => {
    setShadows((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }, []);

  const cssOutput = shadows.map(shadowToCSS).join(", ");

  const copyCSS = useCallback(() => {
    navigator.clipboard.writeText(`box-shadow: ${cssOutput};`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [cssOutput]);

  const inputStyle = {
    backgroundColor: "var(--color-surface)",
    borderColor: "var(--color-border)",
    color: "var(--color-text)",
  };

  return (
    <div className="space-y-4">
      <div
        className="w-full h-40 rounded-xl border flex items-center justify-center"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-secondary, #f5f5f5)" }}
      >
        <div
          className="w-32 h-24 rounded-lg"
          style={{
            backgroundColor: "var(--color-primary)",
            boxShadow: cssOutput,
          }}
        />
      </div>

      <div className="space-y-3">
        {shadows.map((shadow, i) => (
          <div
            key={i}
            className="rounded-lg border p-3 space-y-2"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-secondary, #f9f9f9)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium" style={{ color: "var(--color-text-secondary, #888)" }}>
                Shadow {i + 1}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateShadow(i, "inset", !shadow.inset)}
                  className="px-2 py-0.5 rounded text-xs font-medium border"
                  style={{
                    borderColor: shadow.inset ? "var(--color-primary)" : "var(--color-border)",
                    color: shadow.inset ? "var(--color-primary)" : "var(--color-text)",
                    backgroundColor: shadow.inset ? "var(--color-bg-secondary)" : "transparent",
                  }}
                >
                  Inset
                </button>
                <button
                  onClick={() => removeShadow(i)}
                  disabled={shadows.length <= 1}
                  className="px-2 py-0.5 rounded text-xs"
                  style={{
                    color: shadows.length <= 1 ? "var(--color-border)" : "var(--color-error)",
                    cursor: shadows.length <= 1 ? "not-allowed" : "pointer",
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {([
                ["hOffset", "X Offset", -100, 100],
                ["vOffset", "Y Offset", -100, 100],
                ["blur", "Blur", 0, 200],
                ["spread", "Spread", -100, 100],
              ] as const).map(([field, label, min, max]) => (
                <div key={field} className="space-y-1">
                  <label className="text-[10px]" style={{ color: "var(--color-text-secondary, #888)" }}>{label}</label>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    value={shadow[field]}
                    onChange={(e) => updateShadow(i, field, +e.target.value)}
                    className="w-full accent-[var(--color-primary)]"
                  />
                  <span className="text-[10px] font-mono block text-center" style={{ color: "var(--color-text)" }}>
                    {shadow[field]}px
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="color"
                value={shadow.color.startsWith("rgba") ? "#000000" : shadow.color}
                onChange={(e) => updateShadow(i, "color", e.target.value)}
                className="h-7 w-7 cursor-pointer rounded border p-0"
                style={{ borderColor: "var(--color-border)" }}
              />
              <input
                type="text"
                value={shadow.color}
                onChange={(e) => updateShadow(i, "color", e.target.value)}
                className="flex-1 rounded border px-2 py-1 text-xs font-mono"
                style={inputStyle}
                placeholder="rgba(0,0,0,0.1)"
              />
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addShadow}
        className="px-3 py-1.5 rounded-lg text-sm font-medium border"
        style={{ borderColor: "var(--color-border)", color: "var(--color-primary)" }}
      >
        + Add Shadow
      </button>

      <div className="flex gap-2">
        <textarea
          readOnly
          value={`box-shadow: ${cssOutput};`}
          className="flex-1 p-3 rounded-lg border text-xs font-mono resize-none"
          style={{ ...inputStyle, height: "60px" }}
        />
        <button
          onClick={copyCSS}
          className="px-3 py-2 rounded-lg text-sm font-medium text-white self-end"
          style={{ backgroundColor: copied ? "var(--color-success)" : "var(--color-primary)" }}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
