import { useState, useMemo, useCallback } from "react";

function toTitleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function toCamelCase(s: string): string {
  const words = s.replace(/[^a-zA-Z0-9]+/g, " ").trim().split(/\s+/);
  if (words.length === 0) return "";
  return (
    words[0].toLowerCase() +
    words
      .slice(1)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join("")
  );
}

function toPascalCase(s: string): string {
  return s
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

function toSnakeCase(s: string): string {
  return s
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase();
}

function toKebabCase(s: string): string {
  return toSnakeCase(s).replace(/_/g, "-");
}

function toConstantCase(s: string): string {
  return toSnakeCase(s).toUpperCase();
}

function toDotCase(s: string): string {
  return toSnakeCase(s).replace(/_/g, ".");
}

function toPathCase(s: string): string {
  return toSnakeCase(s).replace(/_/g, "/");
}

type FormatRow = { name: string; convert: (s: string) => string };

const formats: FormatRow[] = [
  { name: "UPPERCASE", convert: (s) => s.toUpperCase() },
  { name: "lowercase", convert: (s) => s.toLowerCase() },
  { name: "Title Case", convert: toTitleCase },
  { name: "camelCase", convert: toCamelCase },
  { name: "PascalCase", convert: toPascalCase },
  { name: "snake_case", convert: toSnakeCase },
  { name: "kebab-case", convert: toKebabCase },
  { name: "CONSTANT_CASE", convert: toConstantCase },
  { name: "dot.case", convert: toDotCase },
  { name: "path/case", convert: toPathCase },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [text]);

  return (
    <button
      onClick={copy}
      className="rounded-lg px-3 py-1 text-xs font-medium transition-colors shrink-0"
      style={{
        backgroundColor: copied ? "#22c55e" : "var(--color-primary)",
        color: "white",
      }}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export default function TextCase() {
  const [text, setText] = useState("");

  const results = useMemo(
    () => formats.map((f) => ({ name: f.name, result: f.convert(text) })),
    [text]
  );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label
          className="block text-sm font-medium mb-1"
          style={{ color: "var(--color-text)" }}
        >
          Input Text
        </label>
        <textarea
          className="w-full rounded-lg border p-3 font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          style={{
            backgroundColor: "var(--color-surface)",
            borderColor: "var(--color-border)",
            color: "var(--color-text)",
          }}
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type or paste text here..."
        />
      </div>

      <div className="flex flex-col gap-2">
        {results.map(({ name, result }) => (
          <div
            key={name}
            className="flex items-center gap-3 rounded-lg border p-3"
            style={{
              backgroundColor: "var(--color-bg-secondary)",
              borderColor: "var(--color-border)",
            }}
          >
            <span
              className="text-xs font-medium w-32 shrink-0"
              style={{ color: "var(--color-text-secondary, #888)" }}
            >
              {name}
            </span>
            <span
              className="flex-1 font-mono text-sm truncate"
              style={{ color: "var(--color-text)" }}
            >
              {result || "\u00A0"}
            </span>
            {text && <CopyButton text={result} />}
          </div>
        ))}
      </div>
    </div>
  );
}
