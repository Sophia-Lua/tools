import { useState, useCallback, useEffect } from "react";

function hexToRgb(hex: string): [number, number, number] | null {
  const match = hex.replace("#", "").match(/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!match) return null;
  return [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)];
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

export default function ColorConverter() {
  const [hex, setHex] = useState("#3b82f6");
  const [rgb, setRgb] = useState({ r: 59, g: 130, b: 246 });
  const [hsl, setHsl] = useState({ h: 217, s: 91, l: 60 });
  const [source, setSource] = useState<"hex" | "rgb" | "hsl">("hex");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const updateFromHex = useCallback((val: string) => {
    setHex(val);
    const parsed = hexToRgb(val);
    if (parsed) {
      const [r, g, b] = parsed;
      setRgb({ r, g, b });
      const [h, s, l] = rgbToHsl(r, g, b);
      setHsl({ h, s, l });
      setSource("hex");
    }
  }, []);

  const updateFromRgb = useCallback((r: number, g: number, b: number) => {
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    setRgb({ r, g, b });
    setHex(rgbToHex(r, g, b));
    const [h, s, l] = rgbToHsl(r, g, b);
    setHsl({ h, s, l });
    setSource("rgb");
  }, []);

  const updateFromHsl = useCallback((h: number, s: number, l: number) => {
    h = Math.max(0, Math.min(360, h));
    s = Math.max(0, Math.min(100, s));
    l = Math.max(0, Math.min(100, l));
    setHsl({ h, s, l });
    const [r, g, b] = hslToRgb(h, s, l);
    setRgb({ r, g, b });
    setHex(rgbToHex(r, g, b));
    setSource("hsl");
  }, []);

  useEffect(() => {
    updateFromHex("#3b82f6");
  }, []);

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
    <div className="space-y-4">
      <div className="flex gap-4 items-start">
        <div
          className="w-24 h-24 rounded-xl border shrink-0"
          style={{
            backgroundColor: hex,
            borderColor: "var(--color-border)",
          }}
        />
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium w-12" style={{ color: "var(--color-text)" }}>HEX</label>
            <input
              className="flex-1 p-2 rounded-lg border text-sm font-mono"
              style={inputStyle}
              value={hex}
              onChange={(e) => updateFromHex(e.target.value)}
            />
            <button
              onClick={() => copyValue(hex, "hex")}
              className="px-2 py-1 rounded text-xs text-white"
              style={{ backgroundColor: copiedField === "hex" ? "#22c55e" : "var(--color-primary)" }}
            >
              {copiedField === "hex" ? "Copied" : "Copy"}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium w-12" style={{ color: "var(--color-text)" }}>RGB</label>
            {(["r", "g", "b"] as const).map((c) => (
              <input
                key={c}
                type="number"
                min={0}
                max={255}
                className="w-16 p-2 rounded-lg border text-sm font-mono"
                style={inputStyle}
                value={rgb[c]}
                onChange={(e) => updateFromRgb(
                  c === "r" ? +e.target.value : rgb.r,
                  c === "g" ? +e.target.value : rgb.g,
                  c === "b" ? +e.target.value : rgb.b
                )}
              />
            ))}
            <button
              onClick={() => copyValue(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, "rgb")}
              className="px-2 py-1 rounded text-xs text-white"
              style={{ backgroundColor: copiedField === "rgb" ? "#22c55e" : "var(--color-primary)" }}
            >
              {copiedField === "rgb" ? "Copied" : "Copy"}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium w-12" style={{ color: "var(--color-text)" }}>HSL</label>
            <input
              type="number"
              min={0}
              max={360}
              className="w-16 p-2 rounded-lg border text-sm font-mono"
              style={inputStyle}
              value={hsl.h}
              onChange={(e) => updateFromHsl(+e.target.value, hsl.s, hsl.l)}
            />
            <input
              type="number"
              min={0}
              max={100}
              className="w-16 p-2 rounded-lg border text-sm font-mono"
              style={inputStyle}
              value={hsl.s}
              onChange={(e) => updateFromHsl(hsl.h, +e.target.value, hsl.l)}
            />
            <input
              type="number"
              min={0}
              max={100}
              className="w-16 p-2 rounded-lg border text-sm font-mono"
              style={inputStyle}
              value={hsl.l}
              onChange={(e) => updateFromHsl(hsl.h, hsl.s, +e.target.value)}
            />
            <button
              onClick={() => copyValue(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, "hsl")}
              className="px-2 py-1 rounded text-xs text-white"
              style={{ backgroundColor: copiedField === "hsl" ? "#22c55e" : "var(--color-primary)" }}
            >
              {copiedField === "hsl" ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
