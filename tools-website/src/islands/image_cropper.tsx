import { useState, useRef, useCallback, useEffect } from "react";

interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export default function ImageCropper() {
  const [file, setFile] = useState<File | null>(null);
  const [imgSrc, setImgSrc] = useState<string>("");
  const [crop, setCrop] = useState<CropRect>({ x: 0, y: 0, w: 0, h: 0 });
  const [inputW, setInputW] = useState("");
  const [inputH, setInputH] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [croppedUrl, setCroppedUrl] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const drawing = useRef(false);
  const start = useRef({ x: 0, y: 0 });

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    if (!f.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }
    setError("");
    setFile(f);
    setCroppedUrl("");
    const reader = new FileReader();
    reader.onload = () => setImgSrc(reader.result as string);
    reader.readAsDataURL(f);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const getCanvasPos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    drawing.current = true;
    const pos = getCanvasPos(e);
    start.current = pos;
    setCrop({ x: pos.x, y: pos.y, w: 0, h: 0 });
  }, [getCanvasPos]);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const pos = getCanvasPos(e);
    const x = Math.min(start.current.x, pos.x);
    const y = Math.min(start.current.y, pos.y);
    const w = Math.abs(pos.x - start.current.x);
    const h = Math.abs(pos.y - start.current.y);
    setCrop({ x, y, w, h });
  }, [getCanvasPos]);

  const onMouseUp = useCallback(() => {
    drawing.current = false;
  }, []);

  useEffect(() => {
    if (!imgSrc || !canvasRef.current || !imgRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = imgRef.current;
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      setInputW(String(img.naturalWidth));
      setInputH(String(img.naturalHeight));
      setCrop({ x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight });
    };
  }, [imgSrc]);

  useEffect(() => {
    if (!imgSrc || !canvasRef.current || !imgRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = imgRef.current;
    if (!ctx || !img.complete) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    if (crop.w > 0 && crop.h > 0) {
      ctx.strokeStyle = "var(--color-primary)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(crop.x, crop.y, crop.w, crop.h);
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(0, 0, canvas.width, crop.y);
      ctx.fillRect(0, crop.y + crop.h, canvas.width, canvas.height - crop.y - crop.h);
      ctx.fillRect(0, crop.y, crop.x, crop.h);
      ctx.fillRect(crop.x + crop.w, crop.y, canvas.width - crop.x - crop.w, crop.h);
    }
  }, [crop, imgSrc]);

  const doCrop = useCallback(() => {
    if (!imgRef.current || crop.w <= 0 || crop.h <= 0) return;
    setLoading(true);
    setError("");
    const img = imgRef.current;
    const offscreen = document.createElement("canvas");
    offscreen.width = crop.w;
    offscreen.height = crop.h;
    const ctx = offscreen.getContext("2d");
    if (!ctx) {
      setError("Failed to crop image.");
      setLoading(false);
      return;
    }
    ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h);
    offscreen.toBlob((blob) => {
      if (!blob) {
        setError("Failed to create cropped image.");
        setLoading(false);
        return;
      }
      if (croppedUrl) URL.revokeObjectURL(croppedUrl);
      setCroppedUrl(URL.createObjectURL(blob));
      setLoading(false);
    }, "image/png");
  }, [crop, croppedUrl]);

  const download = useCallback(() => {
    if (!croppedUrl || !file) return;
    const a = document.createElement("a");
    a.href = croppedUrl;
    a.download = `cropped_${file.name}`;
    a.click();
  }, [croppedUrl, file]);

  const applyDimInputs = useCallback(() => {
    const w = parseInt(inputW);
    const h = parseInt(inputH);
    if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
      setCrop({ x: 0, y: 0, w, h });
    }
  }, [inputW, inputH]);

  return (
    <div className="space-y-4">
      <img ref={imgRef} src={imgSrc} className="hidden" alt="" />
      <canvas ref={canvasRef} className="hidden" />

      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); }}
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-[var(--color-primary)]"
        style={{ borderColor: "var(--color-border)" }}
      >
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        {imgSrc ? (
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Drag on the image below to select crop area</p>
        ) : (
          <p style={{ color: "var(--color-text-secondary)" }}>Drop an image here or click to select</p>
        )}
      </div>

      {error && (
        <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: "color-mix(in srgb, var(--color-error) 10%, transparent)", color: "var(--color-error)" }}>
          {error}
        </div>
      )}

      {imgSrc && (
        <div className="rounded-lg p-4 space-y-3" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
          <canvas
            ref={canvasRef}
            className="w-full rounded cursor-crosshair"
            style={{ maxWidth: "100%" }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          />

          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>Width</label>
              <input
                type="number"
                value={crop.w > 0 ? Math.round(crop.w) : inputW}
                onChange={(e) => setInputW(e.target.value)}
                onBlur={applyDimInputs}
                className="rounded-md px-3 py-1.5 text-sm border w-24"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>Height</label>
              <input
                type="number"
                value={crop.h > 0 ? Math.round(crop.h) : inputH}
                onChange={(e) => setInputH(e.target.value)}
                onBlur={applyDimInputs}
                className="rounded-md px-3 py-1.5 text-sm border w-24"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
              />
            </div>
            <button
              onClick={doCrop}
              disabled={loading}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {loading ? "Cropping..." : "Crop"}
            </button>
          </div>
        </div>
      )}

      {croppedUrl && (
        <div className="rounded-lg p-4 space-y-3" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
          <img src={croppedUrl} alt="Cropped" className="max-h-48 mx-auto rounded" />
          <button
            onClick={download}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: "var(--color-success)" }}
          >
            Download Cropped Image
          </button>
        </div>
      )}
    </div>
  );
}
