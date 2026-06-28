import { useState, useCallback } from "react";

type Algorithm = "MD5" | "SHA-256" | "SHA-512";

function simpleMD5(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = ((hash >>> 0).toString(16)).padStart(8, "0");
  return (hex + hex).slice(0, 32);
}

async function cryptoHash(algorithm: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function HashGenerator() {
  const [input, setInput] = useState("");
  const [algorithm, setAlgorithm] = useState<Algorithm>("SHA-256");
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = useCallback(async () => {
    if (!input) return;
    if (algorithm === "MD5") {
      setResult(simpleMD5(input));
    } else {
      const hash = await cryptoHash(algorithm, input);
      setResult(hash);
    }
  }, [input, algorithm]);

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
          Input Text
        </label>
        <textarea
          className="w-full p-3 rounded-lg border text-sm font-mono"
          style={{
            backgroundColor: "var(--color-surface)",
            borderColor: "var(--color-border)",
            color: "var(--color-text)",
          }}
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter text to hash..."
        />
      </div>
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
          Algorithm:
        </label>
        <select
          className="p-2 rounded-lg border text-sm"
          style={{
            backgroundColor: "var(--color-surface)",
            borderColor: "var(--color-border)",
            color: "var(--color-text)",
          }}
          value={algorithm}
          onChange={(e) => setAlgorithm(e.target.value as Algorithm)}
        >
          <option value="MD5">MD5 (simulated)</option>
          <option value="SHA-256">SHA-256</option>
          <option value="SHA-512">SHA-512</option>
        </select>
        <button
          onClick={generate}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          Generate
        </button>
      </div>
      {result && (
        <div className="relative">
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
            Hash Output
          </label>
          <div
            className="p-3 rounded-lg border text-sm font-mono break-all"
            style={{
              backgroundColor: "var(--color-surface)",
              borderColor: "var(--color-border)",
              color: "var(--color-text)",
            }}
          >
            {result}
          </div>
          <button
            onClick={copyToClipboard}
            className="absolute top-8 right-2 px-3 py-1 rounded text-xs font-medium"
            style={{
              backgroundColor: copied ? "#22c55e" : "var(--color-primary)",
              color: "white",
            }}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      )}
    </div>
  );
}
