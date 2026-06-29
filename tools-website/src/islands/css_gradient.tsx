import { useState, useCallback } from "react";

interface ColorStop {
  color: string;
  position: number;
}

export default function CssGradient() {
  const [type, setType] = useState<"linear" | "radial">("linear");
  const [angle, setAngle] = useState(135);
  const [stops, setStops] = useState<ColorStop[]>([
    { color: "#3b82f6", position: 0 },
    { color: "#8b5cf6", position: 100 },
  ]);
  const [copied, setCopied] = useState(false);

  const buildGradient = useCallback(() => {
    const stopsStr = stops
      .map((s) => `${s.color} ${s.position}%`)
      .join(", ");
    if (type === "linear") return `linear-gradient(${angle}deg, ${stopsStr})`;
    return `radial-gradient(circle, ${stopsStr})`;
  }, [type, angle, stops]);

  const gradientCSS = buildGradient();

  const addStop = useCallback(() => {
    const last = stops[stops.length - 1];
    const newColor = stops.length % 2 === 0 ? "#f59e0b" : "#10b981";
    setStops([...stops, { color: newColor, position: last ? Math.min(last.position + 10, 100) : 50 }]);
  }, [stops]);

  const removeStop = useCallback(
    (index: number) => {
      if (stops.length <= 2) return;
      setStops(stops.filter((_, i) => i !== index));
    },
    [stops]
  );

  const updateStopColor = useCallback(
    (index: number, color: string) => {
      const next = [...stops];
      next[index] = { ...next[index], color };
      setStops(next);
    },
    [stops]
  );

  const updateStopPosition = useCallback(
    (index: number, position: number) => {
      const next = [...stops];
      next[index] = { ...next[index], position: Math.max(0, Math.min(100, position)) };
      setStops(next);
    },
    [stops]
  );

  const copyCSS = useCallback(() => {
    navigator.clipboard.writeText(gradientCSS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [gradientCSS]);

  const inputStyle = {
    backgroundColor: "var(--color-surface)",
    borderColor: "var(--color-border)",
    color: "var(--color-text)",
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setType("linear")}
          className="px-3 py-1.5 rounded-lg text-sm font-medium border"
          style={{
            borderColor: type === "linear" ? "var(--color-primary)" : "var(--color-border)",
            color: type === "linear" ? "var(--color-primary)" : "var(--color-text)",
            backgroundColor: type === "linear" ? "var(--color-bg-secondary)" : "transparent",
          }}
        >
          Linear
        </button>
        <button
          onClick={() => setType("radial")}
          className="px-3 py-1.5 rounded-lg text-sm font-medium border"
          style={{
            borderColor: type === "radial" ? "var(--color-primary)" : "var(--color-border)",
            color: type === "radial" ? "var(--color-primary)" : "var(--color-text)",
            backgroundColor: type === "radial" ? "var(--color-bg-secondary)" : "transparent",
          }}
        >
          Radial
        </button>
      </div>

      {type === "linear" && (
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
            Angle
          </label>
          <input
            type="range"
            min={0}
            max={360}
            value={angle}
            onChange={(e) => setAngle(+e.target.value)}
            className="flex-1 accent-[var(--color-primary)]"
          />
          <span className="text-sm font-mono w-12 text-right" style={{ color: "var(--color-text-secondary)" }}>
            {angle}°
          </span>
        </div>
      )}

      <div className="space-y-2">
        {stops.map((stop, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="color"
              value={stop.color}
              onChange={(e) => updateStopColor(i, e.target.value)}
              className="h-8 w-8 cursor-pointer rounded border p-0"
              style={{ borderColor: "var(--color-border)" }}
            />
            <input
              type="text"
              value={stop.color}
              onChange={(e) => updateStopColor(i, e.target.value)}
              className="w-20 rounded border px-2 py-1 text-xs font-mono"
              style={inputStyle}
            />
            <input
              type="number"
              min={0}
              max={100}
              value={stop.position}
              onChange={(e) => updateStopPosition(i, +e.target.value)}
              className="w-16 rounded border px-2 py-1 text-xs font-mono"
              style={inputStyle}
            />
            <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>%</span>
            <button
              onClick={() => removeStop(i)}
              disabled={stops.length <= 2}
              className="px-2 py-1 rounded text-xs"
              style={{
                color: stops.length <= 2 ? "var(--color-border)" : "var(--color-error)",
                cursor: stops.length <= 2 ? "not-allowed" : "pointer",
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={addStop}
        className="px-3 py-1.5 rounded-lg text-sm font-medium border"
        style={{ borderColor: "var(--color-border)", color: "var(--color-primary)" }}
      >
        + Add Stop
      </button>

      <div
        className="w-full h-32 rounded-xl border"
        style={{ background: gradientCSS, borderColor: "var(--color-border)" }}
      />

      <div className="flex gap-2">
        <textarea
          readOnly
          value={gradientCSS}
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
