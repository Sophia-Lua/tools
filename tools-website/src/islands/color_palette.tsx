import { useState, useCallback } from "react";

function hexToHSL(hex: string): [number, number, number] {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
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

function hslToHex(h: number, s: number, l: number): string {
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
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function isValidHex(hex: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(hex);
}

export default function ColorPalette() {
  const [baseColor, setBaseColor] = useState("#3b82f6");
  const [hexInput, setHexInput] = useState("#3b82f6");
  const [copied, setCopied] = useState<string | null>(null);

  const inputStyle = {
    backgroundColor: "var(--color-surface)",
    borderColor: "var(--color-border)",
    color: "var(--color-text)",
  };

  const handleColorChange = useCallback((hex: string) => {
    setBaseColor(hex);
    setHexInput(hex);
  }, []);

  const handleHexInput = useCallback((val: string) => {
    let hex = val;
    if (!hex.startsWith("#")) hex = "#" + hex;
    setHexInput(hex);
    if (isValidHex(hex)) {
      setBaseColor(hex.toLowerCase());
    }
  }, []);

  const [h, s, l] = hexToHSL(baseColor);

  const tints = Array.from({ length: 5 }, (_, i) => {
    const newL = l + (95 - l) * ((i + 1) / 6);
    return hslToHex(h, s, Math.min(95, newL));
  });

  const shades = Array.from({ length: 5 }, (_, i) => {
    const newL = l - l * ((i + 1) / 6);
    return hslToHex(h, s, Math.max(5, newL));
  });

  const complementary = hslToHex((h + 180) % 360, s, l);

  const analogous = [
    hslToHex((h + 30) % 360, s, l),
    hslToHex((h - 30 + 360) % 360, s, l),
  ];

  const triadic = [
    hslToHex((h + 120) % 360, s, l),
    hslToHex((h + 240) % 360, s, l),
  ];

  const copyColor = useCallback((color: string) => {
    navigator.clipboard.writeText(color.toUpperCase());
    setCopied(color);
    setTimeout(() => setCopied(null), 1500);
  }, []);

  const ColorSwatch = ({ color, label }: { color: string; label?: string }) => (
    <button
      onClick={() => copyColor(color)}
      className="group relative rounded-lg overflow-hidden border transition-transform hover:scale-105"
      style={{ borderColor: "var(--color-border)" }}
      title={`Click to copy ${color.toUpperCase()}`}
    >
      <div className="h-16 w-full" style={{ backgroundColor: color }} />
      <div className="px-2 py-1.5 text-center" style={{ backgroundColor: "var(--color-surface)" }}>
        <span className="text-xs font-mono block" style={{ color: "var(--color-text)" }}>
          {color.toUpperCase()}
        </span>
        {label && (
          <span className="text-[10px] block" style={{ color: "var(--color-text-secondary)" }}>
            {label}
          </span>
        )}
      </div>
      {copied === color && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "var(--color-success)" }}>
          <span className="text-white text-sm font-medium">Copied!</span>
        </div>
      )}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <input
          type="color"
          value={baseColor}
          onChange={(e) => handleColorChange(e.target.value)}
          className="h-12 w-12 cursor-pointer rounded-lg border p-0"
          style={{ borderColor: "var(--color-border)" }}
        />
        <input
          type="text"
          value={hexInput}
          onChange={(e) => handleHexInput(e.target.value)}
          className="flex-1 max-w-[160px] rounded-lg border px-3 py-2 font-mono text-sm"
          style={inputStyle}
          placeholder="#3b82f6"
        />
        <div className="flex-1 flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg border" style={{ backgroundColor: baseColor, borderColor: "var(--color-border)" }} />
          <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            HSL({h}, {s}%, {l}%)
          </span>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2" style={{ color: "var(--color-text)" }}>Tints (Lighter)</h3>
        <div className="grid grid-cols-5 gap-2">
          {tints.map((c, i) => (
            <ColorSwatch key={`tint-${i}`} color={c} />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2" style={{ color: "var(--color-text)" }}>Shades (Darker)</h3>
        <div className="grid grid-cols-5 gap-2">
          {shades.map((c, i) => (
            <ColorSwatch key={`shade-${i}`} color={c} />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2" style={{ color: "var(--color-text)" }}>Complementary</h3>
        <div className="grid grid-cols-2 gap-2 max-w-[280px]">
          <ColorSwatch color={baseColor} label="Base" />
          <ColorSwatch color={complementary} label="Complement" />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2" style={{ color: "var(--color-text)" }}>Analogous</h3>
        <div className="grid grid-cols-3 gap-2 max-w-[420px]">
          <ColorSwatch color={analogous[1]} label="-30°" />
          <ColorSwatch color={baseColor} label="Base" />
          <ColorSwatch color={analogous[0]} label="+30°" />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2" style={{ color: "var(--color-text)" }}>Triadic</h3>
        <div className="grid grid-cols-3 gap-2 max-w-[420px]">
          <ColorSwatch color={baseColor} label="Base" />
          <ColorSwatch color={triadic[0]} label="+120°" />
          <ColorSwatch color={triadic[1]} label="+240°" />
        </div>
      </div>
    </div>
  );
}