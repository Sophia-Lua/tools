import { useState, useCallback, useEffect } from "react";

interface Keyframe {
  percent: number;
  properties: string;
}

export default function CssAnimation() {
  const [name, setName] = useState("my-animation");
  const [duration, setDuration] = useState(1);
  const [delay, setDelay] = useState(0);
  const [iterations, setIterations] = useState(1);
  const [direction, setDirection] = useState<string>("normal");
  const [easing, setEasing] = useState("ease");
  const [keyframes, setKeyframes] = useState<Keyframe[]>([
    { percent: 0, properties: "transform: translateX(0);" },
    { percent: 100, properties: "transform: translateX(100px);" },
  ]);
  const [copied, setCopied] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  const updateKeyframe = useCallback((index: number, field: keyof Keyframe, value: number | string) => {
    setKeyframes((prev) => prev.map((k, i) => (i === index ? { ...k, [field]: value } : k)));
  }, []);

  const addKeyframe = useCallback(() => {
    const last = keyframes[keyframes.length - 1];
    setKeyframes((prev) => [...prev, { percent: last ? Math.min(last.percent + 25, 100) : 50, properties: "" }]);
  }, [keyframes]);

  const removeKeyframe = useCallback((index: number) => {
    setKeyframes((prev) => (prev.length <= 2 ? prev : prev.filter((_, i) => i !== index)));
  }, []);

  const sortedKeyframes = [...keyframes].sort((a, b) => a.percent - b.percent);

  const keyframesCSS = `@keyframes ${name} {\n${sortedKeyframes.map((k) => `  ${k.percent}% {\n    ${k.properties}\n  }`).join("\n")}\n}`;

  const animationCSS = `animation: ${name} ${duration}s ${easing} ${delay}s ${iterations} ${direction};`;

  const fullCSS = `${keyframesCSS}\n\n.box {\n  ${animationCSS}\n}`;

  useEffect(() => {
    let style = document.getElementById("css-anim-preview")
    if (!style) {
      style = document.createElement("style")
      style.id = "css-anim-preview"
      document.head.appendChild(style)
    }
    style.textContent = keyframesCSS
    return () => { style?.remove() }
  }, [keyframesCSS])

  const replay = useCallback(() => setPreviewKey((k) => k + 1), []);

  const copyCSS = useCallback(() => {
    navigator.clipboard.writeText(fullCSS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [fullCSS]);

  const inputStyle = {
    backgroundColor: "var(--color-surface)",
    borderColor: "var(--color-border)",
    color: "var(--color-text)",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium" style={{ color: "var(--color-text)" }}>Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 p-2 rounded-lg border text-sm font-mono"
          style={inputStyle}
        />
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium" style={{ color: "var(--color-text)" }}>Easing</label>
        <select
          value={easing}
          onChange={(e) => setEasing(e.target.value)}
          className="flex-1 p-2 rounded-lg border text-sm"
          style={inputStyle}
        >
          {["linear", "ease", "ease-in", "ease-out", "ease-in-out", "cubic-bezier(0.25,0.1,0.25,1)"].map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs" style={{ color: "var(--color-text-secondary, #888)" }}>Duration (s)</label>
          <input
            type="number"
            min={0.1}
            step={0.1}
            value={duration}
            onChange={(e) => setDuration(+e.target.value)}
            className="w-full p-2 rounded-lg border text-sm font-mono"
            style={inputStyle}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs" style={{ color: "var(--color-text-secondary, #888)" }}>Delay (s)</label>
          <input
            type="number"
            min={0}
            step={0.1}
            value={delay}
            onChange={(e) => setDelay(+e.target.value)}
            className="w-full p-2 rounded-lg border text-sm font-mono"
            style={inputStyle}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs" style={{ color: "var(--color-text-secondary, #888)" }}>Iterations</label>
          <input
            type="number"
            min={0}
            value={iterations}
            onChange={(e) => setIterations(+e.target.value)}
            className="w-full p-2 rounded-lg border text-sm font-mono"
            style={inputStyle}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs" style={{ color: "var(--color-text-secondary, #888)" }}>Direction</label>
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
            className="w-full p-2 rounded-lg border text-sm"
            style={inputStyle}
          >
            {["normal", "reverse", "alternate", "alternate-reverse"].map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      <div
        className="w-full h-24 rounded-xl border flex items-center justify-center overflow-hidden"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-secondary, #f5f5f5)" }}
      >
        <div
          key={previewKey}
          className="w-12 h-12 rounded-lg"
          style={{
            backgroundColor: "var(--color-primary)",
            animation: `${name} ${duration}s ${easing} ${delay}s ${iterations} ${direction}`,
          }}
        />
      </div>
      <button
        onClick={replay}
        className="px-3 py-1.5 rounded-lg text-sm font-medium border"
        style={{ borderColor: "var(--color-border)", color: "var(--color-primary)" }}
      >
        Replay
      </button>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium" style={{ color: "var(--color-text)" }}>Keyframes</span>
          <button
            onClick={addKeyframe}
            className="px-2 py-0.5 rounded text-xs font-medium border"
            style={{ borderColor: "var(--color-border)", color: "var(--color-primary)" }}
          >
            + Add
          </button>
        </div>
        {keyframes.map((kf, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="flex items-center gap-1 shrink-0">
              <input
                type="number"
                min={0}
                max={100}
                value={kf.percent}
                onChange={(e) => updateKeyframe(i, "percent", +e.target.value)}
                className="w-14 p-1.5 rounded border text-xs font-mono text-center"
                style={inputStyle}
              />
              <span className="text-xs" style={{ color: "var(--color-text-secondary, #888)" }}>%</span>
            </div>
            <textarea
              value={kf.properties}
              onChange={(e) => updateKeyframe(i, "properties", e.target.value)}
              className="flex-1 p-1.5 rounded border text-xs font-mono resize-none"
              style={{ ...inputStyle, minHeight: "32px" }}
              rows={1}
              placeholder="e.g. transform: translateX(100px);"
            />
            <button
              onClick={() => removeKeyframe(i)}
              disabled={keyframes.length <= 2}
              className="px-1.5 py-0.5 rounded text-xs shrink-0"
              style={{
                color: keyframes.length <= 2 ? "var(--color-border)" : "var(--color-error)",
                cursor: keyframes.length <= 2 ? "not-allowed" : "pointer",
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <textarea
          readOnly
          value={fullCSS}
          className="flex-1 p-3 rounded-lg border text-xs font-mono resize-none"
          style={{ ...inputStyle, height: "120px" }}
        />
        <button
          onClick={copyCSS}
          className="px-3 py-2 rounded-lg text-sm font-medium text-white self-end"
          style={{ backgroundColor: copied ? "var(--color-success)" : "var(--color-primary)" }}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
