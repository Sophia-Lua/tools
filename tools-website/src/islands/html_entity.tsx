import { useState, useCallback } from "react";

const ENCODE_MAP: [string, string][] = [
  ["&", "&amp;"],
  ["<", "&lt;"],
  [">", "&gt;"],
  ["'", "&#39;"],
  ['"', "&quot;"],
];

function encodeHtmlEntities(text: string): string {
  let result = text;
  for (const [char, entity] of ENCODE_MAP) {
    result = result.replaceAll(char, entity);
  }
  return result;
}

function decodeHtmlEntities(text: string): string {
  const el = document.createElement("textarea");
  el.innerHTML = text;
  return el.value;
}

function containsHtmlEntities(text: string): boolean {
  return /&(#\d+|#x[0-9a-fA-F]+|[a-zA-Z]+);/.test(text);
}

function containsHtmlTags(text: string): boolean {
  return /[<>]/.test(text);
}

export default function HtmlEntity() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const process = useCallback(() => {
    try {
      if (mode === "encode") {
        setOutput(encodeHtmlEntities(input));
      } else {
        setOutput(decodeHtmlEntities(input));
      }
      setError("");
      setCopied(false);
    } catch (e: any) {
      setError(`Error: ${e.message}`);
      setOutput("");
    }
  }, [input, mode]);

  const autoDetect = useCallback(() => {
    if (containsHtmlEntities(input) && !containsHtmlTags(input)) {
      setMode("decode");
      try {
        setOutput(decodeHtmlEntities(input));
        setError("");
        setCopied(false);
      } catch (e: any) {
        setError(`Error: ${e.message}`);
        setOutput("");
      }
    } else if (containsHtmlTags(input)) {
      setMode("encode");
      setOutput(encodeHtmlEntities(input));
      setError("");
      setCopied(false);
    } else {
      setError("Could not auto-detect. Use Encode or Decode manually.");
    }
  }, [input]);

  const copyToClipboard = useCallback(() => {
    if (output) {
      navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [output]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label
          className="block text-sm font-medium mb-1"
          style={{ color: "var(--color-text)" }}
        >
          Input
        </label>
        <textarea
          className="w-full h-32 rounded-lg border p-3 font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          style={{
            backgroundColor: "var(--color-surface)",
            borderColor: "var(--color-border)",
            color: "var(--color-text)",
          }}
          placeholder="Enter text or HTML entities..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={process}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          {mode === "encode" ? "Encode" : "Decode"}
        </button>
        <button
          onClick={autoDetect}
          className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
          style={{
            backgroundColor: "var(--color-surface)",
            borderColor: "var(--color-border)",
            color: "var(--color-text)",
          }}
        >
          Auto-detect
        </button>
        <button
          onClick={() => setMode("encode")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            mode === "encode"
              ? "text-white"
              : "text-[var(--color-text)] border border-[var(--color-border)]"
          }`}
          style={{
            backgroundColor:
              mode === "encode" ? "var(--color-primary)" : "var(--color-surface)",
          }}
        >
          Encode
        </button>
        <button
          onClick={() => setMode("decode")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            mode === "decode"
              ? "text-white"
              : "text-[var(--color-text)] border border-[var(--color-border)]"
          }`}
          style={{
            backgroundColor:
              mode === "decode" ? "var(--color-primary)" : "var(--color-surface)",
          }}
        >
          Decode
        </button>
      </div>

      {error && (
        <div
          className="rounded-lg px-3 py-2 text-sm"
          style={{ backgroundColor: "rgba(239, 68, 68, 0.13)", color: "var(--color-error, #ef4444)" }}
        >
          {error}
        </div>
      )}

      {output && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              className="block text-sm font-medium"
              style={{ color: "var(--color-text)" }}
            >
              Output
            </label>
            <button
              onClick={copyToClipboard}
              className="rounded-lg px-3 py-1 text-xs font-medium text-white transition-colors"
              style={{
                backgroundColor: copied ? "#22c55e" : "var(--color-primary)",
              }}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <textarea
            className="w-full h-32 rounded-lg border p-3 font-mono text-sm resize-y"
            style={{
              backgroundColor: "var(--color-bg-secondary)",
              borderColor: "var(--color-border)",
              color: "var(--color-text)",
            }}
            readOnly
            value={output}
          />
        </div>
      )}
    </div>
  );
}
