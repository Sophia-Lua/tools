import { useState, useCallback } from "react";

const CHARSETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  digits: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
};

function getStrength(password: string): { level: string; color: string; width: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 16) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 2) return { level: "Weak", color: "#ef4444", width: "25%" };
  if (score <= 3) return { level: "Fair", color: "#f59e0b", width: "50%" };
  if (score <= 4) return { level: "Good", color: "#3b82f6", width: "75%" };
  return { level: "Strong", color: "#22c55e", width: "100%" };
}

export default function PasswordGenerator() {
  const [length, setLength] = useState(20);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    digits: true,
    symbols: true,
  });
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = useCallback(() => {
    let chars = "";
    if (options.uppercase) chars += CHARSETS.uppercase;
    if (options.lowercase) chars += CHARSETS.lowercase;
    if (options.digits) chars += CHARSETS.digits;
    if (options.symbols) chars += CHARSETS.symbols;
    if (!chars) chars = CHARSETS.lowercase;

    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    setPassword(Array.from(array, (v) => chars[v % chars.length]).join(""));
    setCopied(false);
  }, [length, options]);

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [password]);

  const strength = password ? getStrength(password) : null;

  const inputStyle = {
    backgroundColor: "var(--color-surface)",
    borderColor: "var(--color-border)",
    color: "var(--color-text)",
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
          Length: {length}
        </label>
        <input
          type="range"
          min={8}
          max={128}
          value={length}
          onChange={(e) => setLength(+e.target.value)}
          className="w-full accent-[var(--color-primary)]"
        />
        <div className="flex justify-between text-xs" style={{ color: "var(--color-text-secondary, #888)" }}>
          <span>8</span><span>128</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-4">
        {Object.keys(CHARSETS).map((key) => (
          <label key={key} className="flex items-center gap-2 text-sm" style={{ color: "var(--color-text)" }}>
            <input
              type="checkbox"
              checked={options[key as keyof typeof options]}
              onChange={(e) => setOptions({ ...options, [key]: e.target.checked })}
              className="rounded"
            />
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={generate}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          Generate
        </button>
        {password && (
          <button
            onClick={copyToClipboard}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: copied ? "#22c55e" : "var(--color-primary)" }}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        )}
      </div>
      {password && (
        <div
          className="p-3 rounded-lg border text-sm font-mono break-all"
          style={{
            backgroundColor: "var(--color-surface)",
            borderColor: "var(--color-border)",
            color: "var(--color-text)",
          }}
        >
          {password}
        </div>
      )}
      {strength && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium" style={{ color: "var(--color-text)" }}>Strength</span>
            <span className="text-sm font-medium" style={{ color: strength.color }}>{strength.level}</span>
          </div>
          <div
            className="h-2 rounded-full"
            style={{ backgroundColor: "var(--color-border)" }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{ width: strength.width, backgroundColor: strength.color }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
