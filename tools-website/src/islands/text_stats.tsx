import { useState, useMemo, useCallback } from "react";

function countSentences(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

export default function TextStats() {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);

  const stats = useMemo(() => {
    const words = countWords(text);
    const chars = text.length;
    const charsNoSpace = text.replace(/\s/g, "").length;
    const lines = text ? text.split("\n").length : 0;
    const sentences = countSentences(text);
    const readingTime = Math.max(1, Math.ceil(words / 200));

    return { words, chars, charsNoSpace, lines, sentences, readingTime };
  }, [text]);

  const copyStats = useCallback(() => {
    const summary = `Words: ${stats.words}\nCharacters: ${stats.chars}\nCharacters (no spaces): ${stats.charsNoSpace}\nLines: ${stats.lines}\nSentences: ${stats.sentences}\nReading time: ~${stats.readingTime} min`;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [stats]);

  const statItems = [
    { label: "Words", value: stats.words },
    { label: "Characters", value: stats.chars },
    { label: "Characters (no spaces)", value: stats.charsNoSpace },
    { label: "Lines", value: stats.lines },
    { label: "Sentences", value: stats.sentences },
    { label: "Reading time", value: `~${stats.readingTime} min` },
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
          Input Text
        </label>
        <textarea
          className="w-full p-3 rounded-lg border text-sm"
          style={{
            backgroundColor: "var(--color-surface)",
            borderColor: "var(--color-border)",
            color: "var(--color-text)",
          }}
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type or paste text here..."
        />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {statItems.map(({ label, value }) => (
          <div
            key={label}
            className="p-3 rounded-lg border text-center"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <p className="text-2xl font-bold font-mono" style={{ color: "var(--color-primary)" }}>
              {value}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary, #888)" }}>
              {label}
            </p>
          </div>
        ))}
      </div>
      <button
        onClick={copyStats}
        className="px-4 py-2 rounded-lg text-sm font-medium text-white"
        style={{ backgroundColor: copied ? "#22c55e" : "var(--color-primary)" }}
      >
        {copied ? "Copied!" : "Copy Stats"}
      </button>
    </div>
  );
}
