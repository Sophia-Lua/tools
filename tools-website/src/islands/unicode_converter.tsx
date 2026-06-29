import { useState, useCallback } from "react";

function getCharName(codePoint: number): string {
  try {
    const char = String.fromCodePoint(codePoint);
    if (char) {
      const name = char.toUpperCase();
      if (codePoint >= 0x41 && codePoint <= 0x5a) return `LATIN CAPITAL LETTER ${name}`;
      if (codePoint >= 0x61 && codePoint <= 0x7a) return `LATIN SMALL LETTER ${name.toUpperCase()}`;
      if (codePoint >= 0x30 && codePoint <= 0x39) return `DIGIT ${name}`;
      if (codePoint === 0x20) return "SPACE";
      if (codePoint === 0x0a) return "LINE FEED";
      if (codePoint === 0x0d) return "CARRIAGE RETURN";
      if (codePoint === 0x09) return "CHARACTER TABULATION";
    }
  } catch {}
  return `U+${codePoint.toString(16).toUpperCase().padStart(4, "0")}`;
}

function textToUnicode(text: string): string {
  const results: string[] = [];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff && i + 1 < text.length) {
      const next = text.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        const codePoint = ((code - 0xd800) << 10) + (next - 0xdc00) + 0x10000;
        results.push(`U+${codePoint.toString(16).toUpperCase().padStart(4, "0")} (${codePoint})`);
        i++;
        continue;
      }
    }
    results.push(`U+${code.toString(16).toUpperCase().padStart(4, "0")} (${code})`);
  }
  return results.join("\n");
}

function unicodeToText(input: string): { text: string; chars: { codePoint: number; hex: string; decimal: number; name: string }[] } {
  const chars: { codePoint: number; hex: string; decimal: number; name: string }[] = [];
  let text = "";

  const tokens = input.match(/U\+([0-9A-Fa-f]{4,6})|([0-9A-Fa-f]{4,6})|(\d{1,7})/g) ?? [];
  for (const token of tokens) {
    let codePoint: number;
    const hexMatch = token.match(/^U\+([0-9A-Fa-f]{4,6})$/);
    if (hexMatch) {
      codePoint = parseInt(hexMatch[1], 16);
    } else if (/^[0-9A-Fa-f]{4,6}$/.test(token)) {
      codePoint = parseInt(token, 16);
    } else if (/^\d{1,7}$/.test(token)) {
      codePoint = parseInt(token, 10);
    } else {
      continue;
    }

    if (codePoint >= 0x10000 && codePoint <= 0x10ffff) {
      const high = Math.floor((codePoint - 0x10000) / 0x400) + 0xd800;
      const low = ((codePoint - 0x10000) % 0x400) + 0xdc00;
      text += String.fromCharCode(high, low);
    } else if (codePoint >= 0 && codePoint <= 0x10ffff) {
      text += String.fromCharCode(codePoint);
    }

    chars.push({
      codePoint,
      hex: `U+${codePoint.toString(16).toUpperCase().padStart(4, "0")}`,
      decimal: codePoint,
      name: getCharName(codePoint),
    });
  }

  return { text, chars };
}

export default function UnicodeConverter() {
  const [textInput, setTextInput] = useState("");
  const [unicodeInput, setUnicodeInput] = useState("");
  const [mode, setMode] = useState<"text" | "unicode">("text");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const unicodeOutput = textToUnicode(textInput);
  const { text: convertedText, chars } = unicodeInput ? unicodeToText(unicodeInput) : { text: "", chars: [] };

  const handleTextChange = useCallback((value: string) => {
    setTextInput(value);
    setMode("text");
  }, []);

  const handleUnicodeChange = useCallback((value: string) => {
    setUnicodeInput(value);
    setMode("unicode");
  }, []);

  const copy = useCallback((value: string, field: string) => {
    navigator.clipboard.writeText(value);
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
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
          Text Input
        </label>
        <div className="flex gap-2">
          <textarea
            className="flex-1 p-3 rounded-lg border text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            style={inputStyle}
            rows={3}
            value={textInput}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Type text here..."
          />
          <button
            onClick={() => copy(unicodeOutput, "textToUnicode")}
            className="px-3 py-2 rounded-lg text-sm font-medium text-white self-start"
            style={{ backgroundColor: copiedField === "textToUnicode" ? "var(--color-success)" : "var(--color-primary)" }}
          >
            {copiedField === "textToUnicode" ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
          Unicode Output (U+XXXX format)
        </label>
        <textarea
          readOnly
          className="w-full p-3 rounded-lg border text-xs font-mono resize-none"
          style={{ ...inputStyle, height: "80px" }}
          value={unicodeOutput}
          placeholder="Unicode output appears here..."
        />
      </div>

      <div className="border-t pt-4" style={{ borderColor: "var(--color-border)" }}>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
          Unicode Input (U+XXXX or decimal)
        </label>
        <div className="flex gap-2">
          <textarea
            className="flex-1 p-3 rounded-lg border text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            style={inputStyle}
            rows={3}
            value={unicodeInput}
            onChange={(e) => handleUnicodeChange(e.target.value)}
            placeholder="e.g. U+0048 U+0065 U+006C U+006C U+006F or 72 101 108 108 111"
          />
          <button
            onClick={() => copy(convertedText, "unicodeToText")}
            className="px-3 py-2 rounded-lg text-sm font-medium text-white self-start"
            style={{ backgroundColor: copiedField === "unicodeToText" ? "var(--color-success)" : "var(--color-primary)" }}
          >
            {copiedField === "unicodeToText" ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
          Converted Text
        </label>
        <textarea
          readOnly
          className="w-full p-3 rounded-lg border text-sm font-mono resize-none"
          style={{ ...inputStyle, height: "60px" }}
          value={convertedText}
          placeholder="Converted text appears here..."
        />
      </div>

      {chars.length > 0 && (
        <div className="space-y-2">
          <span className="text-sm font-medium" style={{ color: "var(--color-text)" }}>Character Info</span>
          <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ backgroundColor: "var(--color-bg-secondary, #f5f5f5)" }}>
                  <th className="p-2 text-left" style={{ color: "var(--color-text-secondary, #888)" }}>Char</th>
                  <th className="p-2 text-left" style={{ color: "var(--color-text-secondary, #888)" }}>Hex</th>
                  <th className="p-2 text-left" style={{ color: "var(--color-text-secondary, #888)" }}>Decimal</th>
                  <th className="p-2 text-left" style={{ color: "var(--color-text-secondary, #888)" }}>Name</th>
                </tr>
              </thead>
              <tbody>
                {chars.map((c, i) => (
                  <tr key={i} className="border-t" style={{ borderColor: "var(--color-border)" }}>
                    <td className="p-2 font-mono text-lg" style={{ color: "var(--color-text)" }}>
                      {String.fromCodePoint(c.codePoint)}
                    </td>
                    <td className="p-2 font-mono" style={{ color: "var(--color-text)" }}>{c.hex}</td>
                    <td className="p-2 font-mono" style={{ color: "var(--color-text)" }}>{c.decimal}</td>
                    <td className="p-2" style={{ color: "var(--color-text-secondary, #888)" }}>{c.name}</td>
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
