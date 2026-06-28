import { useState, useCallback } from "react";

const LOREM_WORDS = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
  "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore",
  "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis", "nostrud",
  "exercitation", "ullamco", "laboris", "nisi", "aliquip", "ex", "ea", "commodo",
  "consequat", "duis", "aute", "irure", "in", "reprehenderit", "voluptate",
  "velit", "esse", "cillum", "fugiat", "nulla", "pariatur", "excepteur", "sint",
  "occaecat", "cupidatat", "non", "proident", "sunt", "culpa", "qui", "officia",
  "deserunt", "mollit", "anim", "id", "est", "laborum", "perspiciatis", "unde",
  "omnis", "iste", "natus", "error", "voluptatem", "accusantium", "doloremque",
  "laudantium", "totam", "rem", "aperiam", "eaque", "ipsa", "quae", "ab", "illo",
  "inventore", "veritatis", "quasi", "architecto", "beatae", "vitae", "dicta",
  "explicabo", "nemo", "ipsam", "quia", "voluptas", "aspernatur", "aut", "odit",
  "fugit", "consequuntur", "magni", "dolores", "ratione", "sequi", "nesciunt",
  "neque", "porro", "quisquam", "nihil", "impedit", "quo", "minus",
];

function generateParagraph(wordCount: number): string {
  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    const word = LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)];
    words.push(i === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word);
    if (i > 0 && i % (8 + Math.floor(Math.random() * 4)) === 0 && i < wordCount - 1) {
      words[words.length - 1] += ".";
    }
  }
  if (!words[words.length - 1].endsWith(".")) {
    words[words.length - 1] += ".";
  }
  return words.join(" ");
}

export default function LoremGenerator() {
  const [paragraphs, setParagraphs] = useState(3);
  const [wordsPerParagraph, setWordsPerParagraph] = useState(50);
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = useCallback(() => {
    const result = Array.from({ length: paragraphs }, () =>
      generateParagraph(wordsPerParagraph)
    ).join("\n\n");
    setOutput(result);
    setCopied(false);
  }, [paragraphs, wordsPerParagraph]);

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  const inputStyle = {
    backgroundColor: "var(--color-surface)",
    borderColor: "var(--color-border)",
    color: "var(--color-text)",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
            Paragraphs
          </label>
          <input
            type="number"
            min={1}
            max={20}
            className="w-24 p-2 rounded-lg border text-sm font-mono"
            style={inputStyle}
            value={paragraphs}
            onChange={(e) => setParagraphs(Math.max(1, Math.min(20, +e.target.value)))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
            Words per paragraph
          </label>
          <input
            type="number"
            min={10}
            max={200}
            className="w-24 p-2 rounded-lg border text-sm font-mono"
            style={inputStyle}
            value={wordsPerParagraph}
            onChange={(e) => setWordsPerParagraph(Math.max(10, Math.min(200, +e.target.value)))}
          />
        </div>
        <div className="flex items-end gap-2">
          <button
            onClick={generate}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Generate
          </button>
          {output && (
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ backgroundColor: copied ? "#22c55e" : "var(--color-primary)" }}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          )}
        </div>
      </div>
      {output && (
        <div
          className="p-4 rounded-lg border text-sm leading-relaxed max-h-96 overflow-y-auto"
          style={{
            backgroundColor: "var(--color-surface)",
            borderColor: "var(--color-border)",
            color: "var(--color-text)",
          }}
        >
          {output.split("\n\n").map((para, i) => (
            <p key={i} className={i > 0 ? "mt-4" : ""}>
              {para}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
