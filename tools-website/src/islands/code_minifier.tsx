import { useState, useCallback } from "react";

type CodeType = "html" | "css" | "javascript";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(2)} KB`;
}

function minifyHTML(html: string): string {
  let result = html;
  result = result.replace(/<!--[\s\S]*?-->/g, "");
  result = result.replace(/\s+/g, " ");
  result = result.replace(/>\s+</g, "><");
  result = result.replace(/\s+\/>/g, "/>");
  result = result.replace(/\s+>/g, ">");
  return result.trim();
}

function minifyCSS(css: string): string {
  let result = css;
  result = result.replace(/\/\*[\s\S]*?\*\//g, "");
  result = result.replace(/\s+/g, " ");
  result = result.replace(/\s*{\s*/g, "{");
  result = result.replace(/\s*}\s*/g, "}");
  result = result.replace(/\s*:\s*/g, ":");
  result = result.replace(/\s*;\s*/g, ";");
  result = result.replace(/\s*,\s*/g, ",");
  result = result.replace(/;\}/g, "}");
  return result.trim();
}

function minifyJS(js: string): string {
  let result = js;
  result = result.replace(/\/\*[\s\S]*?\*\//g, "");
  result = result.replace(/\/\/[^\n]*/g, "");
  result = result.replace(/\s+/g, " ");
  result = result.replace(/\s*{\s*/g, "{");
  result = result.replace(/\s*}\s*/g, "}");
  result = result.replace(/\s*;\s*/g, ";");
  result = result.replace(/\s*,\s*/g, ",");
  result = result.replace(/\s*=\s*/g, "=");
  result = result.replace(/\s*\(\s*/g, "(");
  result = result.replace(/\s*\)\s*/g, ")");
  result = result.replace(/\s*\[\s*/g, "[");
  result = result.replace(/\s*\]\s*/g, "]");
  return result.trim();
}

function beautifyHTML(html: string): string {
  let result = "";
  let indent = 0;
  const tags = html.replace(/>\s*</g, ">\n<").split("\n");

  for (let tag of tags) {
    tag = tag.trim();
    if (!tag) continue;

    if (tag.startsWith("</")) {
      indent = Math.max(0, indent - 1);
    }

    result += "  ".repeat(indent) + tag + "\n";

    if (
      tag.startsWith("<") &&
      !tag.startsWith("</") &&
      !tag.endsWith("/>") &&
      !tag.includes("</") &&
      !/^(meta|link|br|hr|img|input|source|area|base|col|embed|param|track|wbr)\b/i.test(tag.replace(/<\//, "").replace(/<|\/|>/g, "").trim())
    ) {
      indent++;
    }
  }

  return result.trim();
}

function beautifyCSS(css: string): string {
  let result = "";
  let indent = 0;
  const chars = css.replace(/\s+/g, " ").split("");

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (ch === "{") {
      result += " {\n";
      indent++;
    } else if (ch === "}") {
      indent = Math.max(0, indent - 1);
      result += "\n" + "  ".repeat(indent) + "}\n";
    } else if (ch === ";") {
      result += ";\n" + "  ".repeat(indent);
    } else {
      result += ch;
    }
  }

  return result.replace(/\n\s*\n/g, "\n").trim();
}

function beautifyJS(js: string): string {
  let result = "";
  let indent = 0;
  const chars = js.replace(/\s+/g, " ").split("");

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (ch === "{") {
      result += " {\n";
      indent++;
      result += "  ".repeat(indent);
    } else if (ch === "}") {
      indent = Math.max(0, indent - 1);
      result += "\n" + "  ".repeat(indent) + "}";
    } else if (ch === ";") {
      result += ";\n" + "  ".repeat(indent);
    } else {
      result += ch;
    }
  }

  return result.replace(/\n\s*\n/g, "\n").trim();
}

export default function CodeMinifier() {
  const [code, setCode] = useState("<div>\n  <p>Hello World</p>\n</div>");
  const [type, setType] = useState<CodeType>("html");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  const inputStyle = {
    backgroundColor: "var(--color-surface)",
    borderColor: "var(--color-border)",
    color: "var(--color-text)",
  };

  const handleMinify = useCallback(() => {
    if (!code.trim()) return;
    if (type === "html") setOutput(minifyHTML(code));
    else if (type === "css") setOutput(minifyCSS(code));
    else setOutput(minifyJS(code));
    setCopied(false);
  }, [code, type]);

  const handleBeautify = useCallback(() => {
    if (!code.trim()) return;
    if (type === "html") setOutput(beautifyHTML(code));
    else if (type === "css") setOutput(beautifyCSS(code));
    else setOutput(beautifyJS(code));
    setCopied(false);
  }, [code, type]);

  const copyToClipboard = useCallback(() => {
    if (output) {
      navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [output]);

  const inputSize = new Blob([code]).size;
  const outputSize = output ? new Blob([output]).size : 0;
  const savings = inputSize > 0 && outputSize > 0 ? Math.round((1 - outputSize / inputSize) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
            Code Type
          </label>
          <div className="flex gap-1">
            {(["html", "css", "javascript"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors"
                style={{
                  borderColor: type === t ? "var(--color-primary)" : "var(--color-border)",
                  color: type === t ? "var(--color-primary)" : "var(--color-text)",
                  backgroundColor: type === t ? "var(--color-bg-secondary)" : "transparent",
                }}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleBeautify}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          Format
        </button>
        <button
          onClick={handleMinify}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--color-success)" }}
        >
          Minify
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
            Input ({formatSize(inputSize)})
          </label>
          <textarea
            className="w-full h-64 rounded-lg border p-3 font-mono text-xs resize-y focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            style={inputStyle}
            placeholder={`Paste ${type.toUpperCase()} code here...`}
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
            Output {output ? `(${formatSize(outputSize)})` : ""}
          </label>
          <textarea
            className="w-full h-64 rounded-lg border p-3 font-mono text-xs resize-y focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            style={inputStyle}
            readOnly
            placeholder="Result will appear here..."
            value={output}
          />
        </div>
      </div>

      {output && (
        <div className="flex items-center justify-between rounded-lg p-3" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
          <div className="flex items-center gap-4">
            <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              {formatSize(inputSize)} → {formatSize(outputSize)}
            </span>
            <span
              className="text-sm font-medium"
              style={{ color: savings >= 0 ? "var(--color-success)" : "var(--color-error)" }}
            >
              {savings >= 0 ? `↓ ${savings}% smaller` : `↑ ${Math.abs(savings)}% larger`}
            </span>
          </div>
          <button
            onClick={copyToClipboard}
            className="rounded-lg px-4 py-2 text-sm font-medium border"
            style={{
              borderColor: "var(--color-border)",
              color: copied ? "var(--color-success)" : "var(--color-text)",
            }}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      )}
    </div>
  );
}