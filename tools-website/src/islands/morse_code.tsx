import { useState, useCallback, useRef } from "react";

const TEXT_TO_MORSE: Record<string, string> = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.",
  G: "--.", H: "....", I: "..", J: ".---", K: "-.-", L: ".-..",
  M: "--", N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.",
  S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-",
  Y: "-.--", Z: "--..",
  "0": "-----", "1": ".----", "2": "..---", "3": "...--", "4": "....-",
  "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.",
  ".": ".-.-.-", ",": "--..--", "?": "..--..", "'": ".----.", "!": "-.-.--",
  "/": "-..-.", "(": "-.--.", ")": "-.--.-", "&": ".-...", ":": "---...",
  ";": "-.-.-.", "=": "-...-", "+": ".-.-.", "-": "-....-", _: "..--.-",
  '"': ".-..-.", "$": "...-..-", "@": ".--.-.", " ": "/",
};

const MORSE_TO_TEXT: Record<string, string> = {};
Object.entries(TEXT_TO_MORSE).forEach(([text, morse]) => {
  MORSE_TO_TEXT[morse] = text;
});

function textToMorse(text: string): string {
  return text
    .toUpperCase()
    .split("")
    .map((c) => TEXT_TO_MORSE[c] ?? c)
    .join(" ");
}

function morseToText(morse: string): string {
  return morse
    .split(/\s+/)
    .map((code) => (code === "/" ? " " : MORSE_TO_TEXT[code] ?? code))
    .join("");
}

function getCharName(code: string): string {
  const map: Record<string, string> = {
    A: "LATIN CAPITAL LETTER A", B: "LATIN CAPITAL LETTER B",
    C: "LATIN CAPITAL LETTER C", D: "LATIN CAPITAL LETTER D",
    E: "LATIN CAPITAL LETTER E", F: "LATIN CAPITAL LETTER F",
    G: "LATIN CAPITAL LETTER G", H: "LATIN CAPITAL LETTER H",
    I: "LATIN CAPITAL LETTER I", J: "LATIN CAPITAL LETTER J",
    K: "LATIN CAPITAL LETTER K", L: "LATIN CAPITAL LETTER L",
    M: "LATIN CAPITAL LETTER M", N: "LATIN CAPITAL LETTER N",
    O: "LATIN CAPITAL LETTER O", P: "LATIN CAPITAL LETTER P",
    Q: "LATIN CAPITAL LETTER Q", R: "LATIN CAPITAL LETTER R",
    S: "LATIN CAPITAL LETTER S", T: "LATIN CAPITAL LETTER T",
    U: "LATIN CAPITAL LETTER U", V: "LATIN CAPITAL LETTER V",
    W: "LATIN CAPITAL LETTER W", X: "LATIN CAPITAL LETTER X",
    Y: "LATIN CAPITAL LETTER Y", Z: "LATIN CAPITAL LETTER Z",
  };
  return map[code] ?? `CHARACTER: ${code}`;
}

export default function MorseCode() {
  const [text, setText] = useState("");
  const [morse, setMorse] = useState("");
  const [mode, setMode] = useState<"text" | "morse">("text");
  const [copied, setCopied] = useState<"text" | "morse" | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const handleTextChange = useCallback((value: string) => {
    setText(value);
    setMorse(textToMorse(value));
  }, []);

  const handleMorseChange = useCallback((value: string) => {
    setMorse(value);
    setText(morseToText(value));
  }, []);

  const autoConvert = useCallback((value: string, fromMode: "text" | "morse") => {
    if (fromMode === "text") {
      setText(value);
      setMorse(textToMorse(value));
    } else {
      setMorse(value);
      setText(morseToText(value));
    }
  }, []);

  const copy = useCallback((value: string, field: "text" | "morse") => {
    navigator.clipboard.writeText(value);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const playSound = useCallback(() => {
    const codes = morse.split(" ").filter((c) => c !== "/");
    if (codes.length === 0) return;

    const ctx = audioCtxRef.current ?? new AudioContext();
    audioCtxRef.current = ctx;

    const dotDuration = 0.1;
    const dashDuration = dotDuration * 3;
    const symbolGap = dotDuration;
    const letterGap = dotDuration * 3;
    const wordGap = dotDuration * 7;

    let time = ctx.currentTime;
    const originalMorse = morse.split(" ");

    originalMorse.forEach((code) => {
      if (code === "/") {
        time += wordGap;
        return;
      }
      for (let i = 0; i < code.length; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 600;
        osc.type = "sine";
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.value = 0.3;

        const duration = code[i] === "-" ? dashDuration : dotDuration;
        osc.start(time);
        osc.stop(time + duration);
        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
        time += duration + symbolGap;
      }
      time += letterGap - symbolGap;
    });
  }, [morse]);

  const inputStyle = {
    backgroundColor: "var(--color-surface)",
    borderColor: "var(--color-border)",
    color: "var(--color-text)",
  };

  const allLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");
  const symbols = [".", ",", "?", "!", "/", "(", ")", "&", ":", ";", "=", "+", "-", "_", '"', "$", "@"];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
          Text
        </label>
        <div className="flex gap-2">
          <textarea
            className="flex-1 p-3 rounded-lg border text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            style={inputStyle}
            rows={3}
            value={text}
            onChange={(e) => autoConvert(e.target.value, "text")}
            placeholder="Type text here..."
          />
          <button
            onClick={() => copy(text, "text")}
            className="px-3 py-2 rounded-lg text-sm font-medium text-white self-start"
            style={{ backgroundColor: copied === "text" ? "var(--color-success)" : "var(--color-primary)" }}
          >
            {copied === "text" ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
          Morse Code
        </label>
        <div className="flex gap-2">
          <textarea
            className="flex-1 p-3 rounded-lg border text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            style={inputStyle}
            rows={3}
            value={morse}
            onChange={(e) => autoConvert(e.target.value, "morse")}
            placeholder="e.g. .... . .-.. .-.. ---"
          />
          <div className="flex flex-col gap-1">
            <button
              onClick={() => copy(morse, "morse")}
              className="px-3 py-2 rounded-lg text-sm font-medium text-white"
              style={{ backgroundColor: copied === "morse" ? "var(--color-success)" : "var(--color-primary)" }}
            >
              {copied === "morse" ? "Copied" : "Copy"}
            </button>
            <button
              onClick={playSound}
              disabled={!morse}
              className="px-3 py-2 rounded-lg text-sm font-medium border"
              style={{
                borderColor: "var(--color-border)",
                color: morse ? "var(--color-primary)" : "var(--color-border)",
                cursor: morse ? "pointer" : "not-allowed",
              }}
            >
              ▶ Play
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium" style={{ color: "var(--color-text)" }}>Reference Table</span>
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ backgroundColor: "var(--color-bg-secondary, #f5f5f5)" }}>
                <th className="p-2 text-left" style={{ color: "var(--color-text-secondary, #888)" }}>Letter</th>
                <th className="p-2 text-left" style={{ color: "var(--color-text-secondary, #888)" }}>Morse</th>
              </tr>
            </thead>
            <tbody>
              {allLetters.map((l) => (
                <tr key={l} className="border-t" style={{ borderColor: "var(--color-border)" }}>
                  <td className="p-2 font-mono" style={{ color: "var(--color-text)" }}>{l}</td>
                  <td className="p-2 font-mono tracking-widest" style={{ color: "var(--color-text)" }}>{TEXT_TO_MORSE[l]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ backgroundColor: "var(--color-bg-secondary, #f5f5f5)" }}>
                <th className="p-2 text-left" style={{ color: "var(--color-text-secondary, #888)" }}>Symbol</th>
                <th className="p-2 text-left" style={{ color: "var(--color-text-secondary, #888)" }}>Morse</th>
              </tr>
            </thead>
            <tbody>
              {symbols.map((s) => (
                <tr key={s} className="border-t" style={{ borderColor: "var(--color-border)" }}>
                  <td className="p-2 font-mono" style={{ color: "var(--color-text)" }}>{s}</td>
                  <td className="p-2 font-mono tracking-widest" style={{ color: "var(--color-text)" }}>{TEXT_TO_MORSE[s]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
