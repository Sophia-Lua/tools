import { useState, useMemo, useCallback } from "react";

function hexToRgb(hex: string): [number, number, number] | null {
  const match = hex.replace("#", "").match(/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!match) return null;
  return [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)];
}

function luminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export default function ContrastChecker() {
  const [foreground, setForeground] = useState("#1e293b");
  const [background, setBackground] = useState("#ffffff");

  const fgRgb = useMemo(() => hexToRgb(foreground), [foreground]);
  const bgRgb = useMemo(() => hexToRgb(background), [background]);

  const ratio = useMemo(() => {
    if (!fgRgb || !bgRgb) return 0;
    const l1 = luminance(...fgRgb);
    const l2 = luminance(...bgRgb);
    return contrastRatio(l1, l2);
  }, [fgRgb, bgRgb]);

  const checks = useMemo(
    () => [
      { label: "AA Normal", threshold: 4.5, pass: ratio >= 4.5 },
      { label: "AAA Normal", threshold: 7, pass: ratio >= 7 },
      { label: "AA Large", threshold: 3, pass: ratio >= 3 },
      { label: "AAA Large", threshold: 4.5, pass: ratio >= 4.5 },
    ],
    [ratio]
  );

  const isValidHex = useCallback((v: string) => /^#[0-9a-f]{6}$/i.test(v), []);

  const inputStyle = {
    backgroundColor: "var(--color-surface)",
    borderColor: "var(--color-border)",
    color: "var(--color-text)",
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
            Foreground
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={foreground}
              onChange={(e) => setForeground(e.target.value)}
              className="h-10 w-10 cursor-pointer rounded border p-0"
              style={{ borderColor: "var(--color-border)" }}
            />
            <input
              type="text"
              value={foreground}
              onChange={(e) => {
                const v = e.target.value;
                if (isValidHex(v)) setForeground(v);
              }}
              className="flex-1 p-2 rounded-lg border text-sm font-mono"
              style={inputStyle}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
            Background
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              className="h-10 w-10 cursor-pointer rounded border p-0"
              style={{ borderColor: "var(--color-border)" }}
            />
            <input
              type="text"
              value={background}
              onChange={(e) => {
                const v = e.target.value;
                if (isValidHex(v)) setBackground(v);
              }}
              className="flex-1 p-2 rounded-lg border text-sm font-mono"
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-4 rounded-xl border" style={{ borderColor: "var(--color-border)" }}>
        <span className="text-3xl font-bold font-mono" style={{ color: "var(--color-primary)" }}>
          {ratio.toFixed(2)}:1
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {checks.map((c) => (
          <div
            key={c.label}
            className="flex items-center gap-2 p-2 rounded-lg border text-sm"
            style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
          >
            <span style={{ color: c.pass ? "var(--color-success)" : "var(--color-error)" }}>
              {c.pass ? "✅" : "❌"}
            </span>
            <span>{c.label}</span>
            <span className="ml-auto text-xs font-mono" style={{ color: "var(--color-text-secondary)" }}>
              ≥{c.threshold}:1
            </span>
          </div>
        ))}
      </div>

      <div
        className="p-6 rounded-xl border"
        style={{ backgroundColor: background, borderColor: "var(--color-border)" }}
      >
        <p className="text-2xl font-bold mb-2" style={{ color: foreground }}>
          Large Text Sample
        </p>
        <p className="text-base mb-2" style={{ color: foreground }}>
          Normal text sample — The quick brown fox jumps over the lazy dog.
        </p>
        <p className="text-sm" style={{ color: foreground }}>
          Small text sample — Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        </p>
      </div>
    </div>
  );
}
