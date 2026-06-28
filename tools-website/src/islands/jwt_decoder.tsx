import { useState, useCallback } from "react";

function base64UrlDecode(str: string): string {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return decodeURIComponent(
    atob(padded)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
}

function toHex(str: string): string {
  return Array.from(new TextEncoder().encode(str))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function JwtDecoder() {
  const [jwt, setJwt] = useState("");
  const [header, setHeader] = useState("");
  const [payload, setPayload] = useState("");
  const [signature, setSignature] = useState("");
  const [error, setError] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const decode = useCallback(() => {
    setError("");
    setHeader("");
    setPayload("");
    setSignature("");
    try {
      const parts = jwt.trim().split(".");
      if (parts.length < 2) throw new Error("Invalid JWT format");
      const decodedHeader = base64UrlDecode(parts[0]);
      const decodedPayload = base64UrlDecode(parts[1]);
      setHeader(JSON.stringify(JSON.parse(decodedHeader), null, 2));
      setPayload(JSON.stringify(JSON.parse(decodedPayload), null, 2));
      if (parts[2]) {
        setSignature(toHex(base64UrlDecode(parts[2])));
      }
    } catch (e) {
      setError("Invalid JWT string");
    }
  }, [jwt]);

  const copyToClipboard = useCallback((text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  const CopyButton = ({ text, field }: { text: string; field: string }) => (
    <button
      onClick={() => copyToClipboard(text, field)}
      className="absolute top-2 right-2 px-3 py-1 rounded text-xs font-medium text-white"
      style={{ backgroundColor: copiedField === field ? "#22c55e" : "var(--color-primary)" }}
    >
      {copiedField === field ? "Copied!" : "Copy"}
    </button>
  );

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
          JWT Token
        </label>
        <textarea
          className="w-full p-3 rounded-lg border text-sm font-mono"
          style={{
            backgroundColor: "var(--color-surface)",
            borderColor: "var(--color-border)",
            color: "var(--color-text)",
          }}
          rows={3}
          value={jwt}
          onChange={(e) => setJwt(e.target.value)}
          placeholder="Paste JWT here..."
        />
      </div>
      <button
        onClick={decode}
        className="px-4 py-2 rounded-lg text-sm font-medium text-white"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        Decode
      </button>
      {error && (
        <p className="text-sm font-medium" style={{ color: "var(--color-error, #ef4444)" }}>
          {error}
        </p>
      )}
      {header && (
        <div className="relative">
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
            Header
          </label>
          <pre
            className="p-3 rounded-lg border text-sm font-mono overflow-x-auto"
            style={{
              backgroundColor: "var(--color-surface)",
              borderColor: "var(--color-border)",
              color: "var(--color-text)",
            }}
          >
            {header}
          </pre>
          <CopyButton text={header} field="header" />
        </div>
      )}
      {payload && (
        <div className="relative">
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
            Payload
          </label>
          <pre
            className="p-3 rounded-lg border text-sm font-mono overflow-x-auto"
            style={{
              backgroundColor: "var(--color-surface)",
              borderColor: "var(--color-border)",
              color: "var(--color-text)",
            }}
          >
            {payload}
          </pre>
          <CopyButton text={payload} field="payload" />
        </div>
      )}
      {signature && (
        <div className="relative">
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
            Signature (hex)
          </label>
          <pre
            className="p-3 rounded-lg border text-sm font-mono break-all"
            style={{
              backgroundColor: "var(--color-surface)",
              borderColor: "var(--color-border)",
              color: "var(--color-text)",
            }}
          >
            {signature}
          </pre>
          <CopyButton text={signature} field="sig" />
        </div>
      )}
    </div>
  );
}
