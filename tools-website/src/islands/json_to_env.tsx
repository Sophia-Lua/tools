import { useState, useCallback } from "react";

function flattenObject(obj: Record<string, any>, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}_${key}` : key;
    const val = obj[key];
    if (val !== null && typeof val === "object" && !Array.isArray(val)) {
      Object.assign(result, flattenObject(val, fullKey));
    } else if (Array.isArray(val)) {
      val.forEach((item: any, i: number) => {
        if (typeof item === "object" && item !== null) {
          Object.assign(result, flattenObject(item, `${fullKey}_${i}`));
        } else {
          result[`${fullKey}_${i}`] = String(item);
        }
      });
    } else {
      result[fullKey] = String(val);
    }
  }
  return result;
}

function unflattenObject(obj: Record<string, string>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const parts = key.split("_");
    let current: any = result;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      const next = parts[i + 1];
      const isNextIndex = /^\d+$/.test(next);
      if (!(part in current)) {
        current[part] = isNextIndex ? [] : {};
      }
      current = current[part];
    }
    const lastKey = parts[parts.length - 1];
    current[lastKey] = obj[key];
  }
  return result;
}

function jsonToEnv(json: string): string {
  const parsed = JSON.parse(json);
  const flat = flattenObject(parsed);
  return Object.entries(flat)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
}

function envToJson(env: string): string {
  const lines = env.split("\n").filter((l) => l.trim() && !l.trim().startsWith("#"));
  const flat: Record<string, string> = {};
  for (const line of lines) {
    const eqIdx = line.indexOf("=");
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    const val = line.slice(eqIdx + 1).trim();
    flat[key] = val;
  }
  const obj = unflattenObject(flat);
  return JSON.stringify(obj, null, 2);
}

export default function JsonToEnv() {
  const [jsonInput, setJsonInput] = useState('{\n  "DB_HOST": "localhost",\n  "DB_PORT": 5432,\n  "API": {\n    "KEY": "secret",\n    "TIMEOUT": 30\n  },\n  "FEATURES": ["auth", "dashboard"]\n}');
  const [envOutput, setEnvOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"toEnv" | "toJson">("toEnv");

  const inputStyle = {
    backgroundColor: "var(--color-surface)",
    borderColor: "var(--color-border)",
    color: "var(--color-text)",
  };

  const handleConvert = useCallback(() => {
    try {
      const env = jsonToEnv(jsonInput);
      setEnvOutput(env);
      setError("");
    } catch (e: any) {
      setError(`Invalid JSON: ${e.message}`);
      setEnvOutput("");
    }
  }, [jsonInput]);

  const handleReverse = useCallback(() => {
    try {
      const json = envToJson(envOutput || jsonInput);
      setJsonInput(json);
      setError("");
    } catch (e: any) {
      setError(`Invalid .env format: ${e.message}`);
    }
  }, [envOutput, jsonInput]);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, []);

  const download = useCallback((content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex gap-1">
        <button
          onClick={() => setActiveTab("toEnv")}
          className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors"
          style={{
            borderColor: activeTab === "toEnv" ? "var(--color-primary)" : "var(--color-border)",
            color: activeTab === "toEnv" ? "var(--color-primary)" : "var(--color-text)",
            backgroundColor: activeTab === "toEnv" ? "var(--color-bg-secondary)" : "transparent",
          }}
        >
          JSON → .env
        </button>
        <button
          onClick={() => setActiveTab("toJson")}
          className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors"
          style={{
            borderColor: activeTab === "toJson" ? "var(--color-primary)" : "var(--color-border)",
            color: activeTab === "toJson" ? "var(--color-primary)" : "var(--color-text)",
            backgroundColor: activeTab === "toJson" ? "var(--color-bg-secondary)" : "transparent",
          }}
        >
          .env → JSON
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
            {activeTab === "toEnv" ? "JSON Input" : ".env Input"}
          </label>
          <textarea
            className="w-full h-64 rounded-lg border p-3 font-mono text-xs resize-y focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            style={inputStyle}
            placeholder={activeTab === "toEnv" ? "Paste JSON here..." : "Paste .env content here..."}
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
            {activeTab === "toEnv" ? ".env Output" : "JSON Output"}
          </label>
          <textarea
            className="w-full h-64 rounded-lg border p-3 font-mono text-xs resize-y focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            style={inputStyle}
            readOnly
            placeholder={activeTab === "toEnv" ? ".env output will appear here..." : "JSON output will appear here..."}
            value={envOutput}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: "color-mix(in srgb, var(--color-error) 10%, transparent)", color: "var(--color-error)" }}>
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={activeTab === "toEnv" ? handleConvert : handleReverse}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          {activeTab === "toEnv" ? "Convert to .env" : "Convert to JSON"}
        </button>
        <button
          onClick={activeTab === "toEnv" ? handleReverse : handleConvert}
          className="rounded-lg px-4 py-2 text-sm font-medium border"
          style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
        >
          {activeTab === "toEnv" ? "Reverse (.env → JSON)" : "Reverse (JSON → .env)"}
        </button>
        {envOutput && (
          <>
            <button
              onClick={() => copyToClipboard(envOutput)}
              className="rounded-lg px-4 py-2 text-sm font-medium border"
              style={{
                borderColor: "var(--color-border)",
                color: copied ? "var(--color-success)" : "var(--color-text)",
              }}
            >
              {copied ? "Copied!" : "Copy Output"}
            </button>
            <button
              onClick={() => download(envOutput, activeTab === "toEnv" ? ".env" : "env.json")}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: "var(--color-success)" }}
            >
              Download
            </button>
          </>
        )}
      </div>
    </div>
  );
}