import { useState, useRef, useCallback, useEffect } from "react"
import JSZip from "jszip"

interface Region {
  id: string
  x: number
  y: number
  w: number
  h: number
  name: string
  exportW: number
  exportH: number
  format: "png" | "jpeg" | "webp"
}

type HandlePosition = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w"

let regionCounter = 0

function genId() {
  return `r_${Date.now()}_${++regionCounter}`
}

export default function ImageSlicer() {
  const [imgSrc, setImgSrc] = useState("")
  const [imgName, setImgName] = useState("")
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 })
  const [regions, setRegions] = useState<Region[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [showGridModal, setShowGridModal] = useState(false)
  const [gridCols, setGridCols] = useState(3)
  const [gridRows, setGridRows] = useState(3)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const jsonFileRef = useRef<HTMLInputElement>(null)

  const drawing = useRef(false)
  const drawingStart = useRef({ x: 0, y: 0 })
  const dragging = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const resizing = useRef<HandlePosition | null>(null)
  const resizeStart = useRef({ x: 0, y: 0, region: null as Region | null })

  const getDisplayScale = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return 1
    return canvas.width / canvas.getBoundingClientRect().width
  }, [])

  const getCanvasPos = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return { x: 0, y: 0 }
      const rect = canvas.getBoundingClientRect()
      const scale = getDisplayScale()
      return {
        x: (e.clientX - rect.left) * scale,
        y: (e.clientY - rect.top) * scale,
      }
    },
    [getDisplayScale]
  )

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return
    const f = files[0]
    if (!f.type.startsWith("image/")) {
      setError("Please select a valid image file.")
      return
    }
    setError("")
    setImgName(f.name)
    setRegions([])
    setSelectedId(null)
    regionCounter = 0
    const reader = new FileReader()
    reader.onload = () => setImgSrc(reader.result as string)
    reader.readAsDataURL(f)
  }, [])

  const importJson = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return
    const f = files[0]
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string)
        let parsed: Region[] = []

        if (data && typeof data === "object" && data.frames && typeof data.frames === "object") {
          // Cocos Creator spriteframe atlas format: { frames: { name: { x, y, w, h } } }
          const raw: Region[] = []
          for (const [name, v] of Object.entries<{ x: number; y: number; w: number; h: number }>(data.frames)) {
            if (typeof v !== "object" || v === null) continue
            const x = Number(v.x), y = Number(v.y), w = Number(v.w), h = Number(v.h)
            if (!isFinite(x) || !isFinite(y) || !isFinite(w) || !isFinite(h)) continue
            raw.push({
              id: genId(),
              x: Math.round(x),
              y: Math.round(y),
              w: Math.round(w),
              h: Math.round(h),
              name,
              exportW: Math.round(w),
              exportH: Math.round(h),
              format: "png" as const,
            })
          }
          parsed = raw
        } else if (Array.isArray(data?.regions)) {
          // Tool's own export format: { image: {...}, regions: [...] }
          const raw: Region[] = []
          for (const item of data.regions as { name?: string; x?: number; y?: number; w?: number; h?: number; exportW?: number; exportH?: number; format?: string }[]) {
            const x = Number(item?.x), y = Number(item?.y), w = Number(item?.w), h = Number(item?.h)
            if (!isFinite(x) || !isFinite(y) || !isFinite(w) || !isFinite(h)) continue
            const format = item?.format === "jpeg" || item?.format === "webp" || item?.format === "png" ? item.format : "png"
            raw.push({
              id: genId(),
              x: Math.round(x),
              y: Math.round(y),
              w: Math.round(w),
              h: Math.round(h),
              name: String(item?.name ?? "region"),
              exportW: Math.round(Number(item?.exportW) || w),
              exportH: Math.round(Number(item?.exportH) || h),
              format: format as Region["format"],
            })
          }
          parsed = raw
        } else {
          throw new Error("Unrecognized JSON structure. Expected { frames: {...} } or { regions: [...] }.")
        }

        if (parsed.length === 0) {
          setError("No valid regions found in JSON.")
          return
        }

        setError("")
        setRegions(parsed)
        setSelectedId(null)
      } catch (e) {
        setError(`Invalid JSON: ${(e as Error).message}`)
      }
      if (jsonFileRef.current) jsonFileRef.current.value = ""
    }
    reader.readAsText(f)
  }, [])

  useEffect(() => {
    if (!imgSrc || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    let cancelled = false
    const tmp = new Image()
    tmp.onload = () => {
      if (cancelled) return
      canvas.width = tmp.naturalWidth
      canvas.height = tmp.naturalHeight
      ctx.drawImage(tmp, 0, 0)
      setImgSize({ w: tmp.naturalWidth, h: tmp.naturalHeight })
      if (imgRef.current) {
        imgRef.current.src = tmp.src
      }
    }
    tmp.src = imgSrc
    return () => { cancelled = true }
  }, [imgSrc])

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img || !img.complete) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0)

    regions.forEach((r, i) => {
      const isSelected = r.id === selectedId
      ctx.fillStyle = "rgba(0,0,0,0.25)"
      ctx.fillRect(r.x, r.y, r.w, r.h)
      ctx.strokeStyle = isSelected ? "#3b82f6" : "#ffffff"
      ctx.lineWidth = isSelected ? 3 : 2
      ctx.setLineDash(isSelected ? [] : [6, 4])
      ctx.strokeRect(r.x, r.y, r.w, r.h)
      ctx.setLineDash([])

      ctx.fillStyle = isSelected ? "#3b82f6" : "rgba(0,0,0,0.6)"
      const label = `${i + 1}`
      ctx.font = "bold 14px sans-serif"
      const tw = ctx.measureText(label).width
      ctx.fillRect(r.x + 2, r.y + 2, tw + 8, 20)
      ctx.fillStyle = "#fff"
      ctx.fillText(label, r.x + 6, r.y + 16)

      if (isSelected) {
        const handles = getHandlePositions(r)
        Object.values(handles).forEach((pos) => {
          ctx.beginPath()
          ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2)
          ctx.fillStyle = "#3b82f6"
          ctx.fill()
          ctx.strokeStyle = "#fff"
          ctx.lineWidth = 1.5
          ctx.stroke()
        })
      }
    })
  }, [regions, selectedId])

  useEffect(() => {
    redraw()
  }, [redraw])

  const getHandlePositions = (r: Region) => ({
    nw: { x: r.x, y: r.y },
    n: { x: r.x + r.w / 2, y: r.y },
    ne: { x: r.x + r.w, y: r.y },
    e: { x: r.x + r.w, y: r.y + r.h / 2 },
    se: { x: r.x + r.w, y: r.y + r.h },
    s: { x: r.x + r.w / 2, y: r.y + r.h },
    sw: { x: r.x, y: r.y + r.h },
    w: { x: r.x, y: r.y + r.h / 2 },
  })

  const hitTestHandle = useCallback(
    (pos: { x: number; y: number }): HandlePosition | null => {
      const sel = regions.find((r) => r.id === selectedId)
      if (!sel) return null
      const handles = getHandlePositions(sel)
      for (const [key, hpos] of Object.entries(handles)) {
        if (Math.abs(pos.x - hpos.x) < 8 && Math.abs(pos.y - hpos.y) < 8) {
          return key as HandlePosition
        }
      }
      return null
    },
    [regions, selectedId]
  )

  const hitTestRegion = useCallback(
    (pos: { x: number; y: number }): string | null => {
      for (let i = regions.length - 1; i >= 0; i--) {
        const r = regions[i]
        if (pos.x >= r.x && pos.x <= r.x + r.w && pos.y >= r.y && pos.y <= r.y + r.h) {
          return r.id
        }
      }
      return null
    },
    [regions]
  )

  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const pos = getCanvasPos(e)
      const handle = hitTestHandle(pos)
      if (handle) {
        resizing.current = handle
        const sel = regions.find((r) => r.id === selectedId)
        if (sel) resizeStart.current = { x: pos.x, y: pos.y, region: { ...sel } }
        return
      }
      const hitId = hitTestRegion(pos)
      if (hitId) {
        setSelectedId(hitId)
        dragging.current = true
        const r = regions.find((rg) => rg.id === hitId)!
        dragOffset.current = { x: pos.x - r.x, y: pos.y - r.y }
        return
      }
      drawing.current = true
      drawingStart.current = pos
      setSelectedId(null)
    },
    [getCanvasPos, hitTestHandle, hitTestRegion, regions, selectedId]
  )

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const pos = getCanvasPos(e)

      if (resizing.current && resizeStart.current.region) {
        const handle = resizing.current
        const orig = resizeStart.current.region
        const dx = pos.x - resizeStart.current.x
        const dy = pos.y - resizeStart.current.y
        let nx = orig.x, ny = orig.y, nw = orig.w, nh = orig.h

        if (handle.includes("w")) { nx = orig.x + dx; nw = orig.w - dx }
        if (handle.includes("e") || handle === "e") { nw = orig.w + dx }
        if (handle.includes("n") || handle === "n" || handle === "nw" || handle === "ne") {
          if (handle !== "e" && handle !== "w" && handle !== "s") {
            ny = orig.y + dy; nh = orig.h - dy
          }
        }
        if (handle.includes("s") || handle === "s") { nh = orig.h + dy }

        if (nw < 10) { nw = 10; if (handle.includes("w")) nx = orig.x + orig.w - 10 }
        if (nh < 10) { nh = 10; if (handle.includes("n")) ny = orig.y + orig.h - 10 }
        nx = Math.max(0, Math.min(nx, imgSize.w - nw))
        ny = Math.max(0, Math.min(ny, imgSize.h - nh))
        nw = Math.min(nw, imgSize.w - nx)
        nh = Math.min(nh, imgSize.h - ny)

        setRegions((prev) =>
          prev.map((r) => (r.id === selectedId ? { ...r, x: Math.round(nx), y: Math.round(ny), w: Math.round(nw), h: Math.round(nh) } : r))
        )
        return
      }

      if (dragging.current && selectedId) {
        const nx = pos.x - dragOffset.current.x
        const ny = pos.y - dragOffset.current.y
        const r = regions.find((rg) => rg.id === selectedId)
        if (!r) return
        const clampedX = Math.max(0, Math.min(nx, imgSize.w - r.w))
        const clampedY = Math.max(0, Math.min(ny, imgSize.h - r.h))
        setRegions((prev) =>
          prev.map((rg) => (rg.id === selectedId ? { ...rg, x: Math.round(clampedX), y: Math.round(clampedY) } : rg))
        )
        return
      }

      if (drawing.current) {
        redraw()
        const canvas = canvasRef.current
        const ctx = canvas?.getContext("2d")
        if (!ctx) return
        const sx = Math.min(drawingStart.current.x, pos.x)
        const sy = Math.min(drawingStart.current.y, pos.y)
        const sw = Math.abs(pos.x - drawingStart.current.x)
        const sh = Math.abs(pos.y - drawingStart.current.y)
        ctx.strokeStyle = "#3b82f6"
        ctx.lineWidth = 2
        ctx.setLineDash([6, 4])
        ctx.strokeRect(sx, sy, sw, sh)
        ctx.setLineDash([])
      }

      const canvas = canvasRef.current
      if (canvas) {
        const handle = hitTestHandle(pos)
        const hitId = hitTestRegion(pos)
        canvas.style.cursor = handle ? getCursorForHandle(handle) : hitId ? "move" : "crosshair"
      }
    },
    [getCanvasPos, hitTestHandle, hitTestRegion, imgSize, redraw, regions, selectedId]
  )

  const onMouseUp = useCallback(() => {
    if (drawing.current) {
      drawing.current = false
    }
    if (dragging.current) {
      dragging.current = false
    }
    if (resizing.current) {
      resizing.current = null
      resizeStart.current = { x: 0, y: 0, region: null }
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        const active = document.activeElement
        if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) return
        setRegions((prev) => prev.filter((r) => r.id !== selectedId))
        setSelectedId(null)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedId])

  const addRegion = useCallback(() => {
    if (!imgSize.w) return
    const last = regions[regions.length - 1]
    const w = last ? last.w : Math.min(200, imgSize.w)
    const h = last ? last.h : Math.min(150, imgSize.h)
    const r: Region = {
      id: genId(),
      x: last ? last.x : 0,
      y: last ? last.y : 0,
      w,
      h,
      name: `region_${regions.length + 1}`,
      exportW: last ? last.exportW : w,
      exportH: last ? last.exportH : h,
      format: last ? last.format : "png",
    }
    setRegions((prev) => [...prev, r])
    setSelectedId(r.id)
  }, [imgSize, regions])

  const updateRegion = useCallback((id: string, patch: Partial<Region>) => {
    setRegions((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r
        const updated = { ...r, ...patch }
        if ("w" in patch && patch.w !== undefined && !("exportW" in patch)) {
          updated.exportW = patch.w
        }
        if ("h" in patch && patch.h !== undefined && !("exportH" in patch)) {
          updated.exportH = patch.h
        }
        return updated
      })
    )
  }, [])

  const removeRegion = useCallback(
    (id: string) => {
      setRegions((prev) => prev.filter((r) => r.id !== id))
      if (selectedId === id) setSelectedId(null)
    },
    [selectedId]
  )

  const exportRegion = useCallback(
    (r: Region) => {
      const img = imgRef.current
      if (!img || !img.complete) return
      const offscreen = document.createElement("canvas")
      offscreen.width = r.exportW
      offscreen.height = r.exportH
      const ctx = offscreen.getContext("2d")
      if (!ctx) return
      ctx.drawImage(img, r.x, r.y, r.w, r.h, 0, 0, r.exportW, r.exportH)
      const mimeMap = { png: "image/png", jpeg: "image/jpeg", webp: "image/webp" }
      offscreen.toBlob(
        (blob) => {
          if (!blob) return
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `${r.name}.${r.format}`
          a.click()
          URL.revokeObjectURL(url)
        },
        mimeMap[r.format],
        0.92
      )
    },
    []
  )

  const exportAll = useCallback(() => {
    regions.forEach((r, i) => {
      setTimeout(() => exportRegion(r), i * 200)
    })
  }, [regions, exportRegion])

  const exportJson = useCallback(() => {
    const data = {
      image: { width: imgSize.w, height: imgSize.h, name: imgName },
      regions: regions.map((r) => ({
        name: r.name,
        x: r.x,
        y: r.y,
        w: r.w,
        h: r.h,
        exportW: r.exportW,
        exportH: r.exportH,
        format: r.format,
      })),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${imgName || "image"}_regions.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [imgSize, imgName, regions])

  const autoGrid = useCallback(() => {
    if (!imgSize.w || !imgSize.h) return
    const cellW = imgSize.w / gridCols
    const cellH = imgSize.h / gridRows
    const newRegions: Region[] = []
    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        newRegions.push({
          id: genId(),
          x: Math.round(c * cellW),
          y: Math.round(r * cellH),
          w: Math.round(cellW),
          h: Math.round(cellH),
          name: `grid_${r}_${c}`,
          exportW: Math.round(cellW),
          exportH: Math.round(cellH),
          format: "png",
        })
      }
    }
    setRegions(newRegions)
    setShowGridModal(false)
  }, [imgSize, gridCols, gridRows])

  const applyPreset = useCallback(
    (w: number, h: number) => {
      setRegions((prev) =>
        prev.map((r) => ({ ...r, exportW: w, exportH: h }))
      )
    },
    []
  )

  const regionToBlob = useCallback(
    (r: Region): Promise<Blob | null> => {
      return new Promise((resolve) => {
        const img = imgRef.current
        if (!img || !img.complete) { resolve(null); return }
        const offscreen = document.createElement("canvas")
        offscreen.width = r.exportW
        offscreen.height = r.exportH
        const ctx = offscreen.getContext("2d")
        if (!ctx) { resolve(null); return }
        ctx.drawImage(img, r.x, r.y, r.w, r.h, 0, 0, r.exportW, r.exportH)
        const mimeMap = { png: "image/png", jpeg: "image/jpeg", webp: "image/webp" }
        offscreen.toBlob((blob) => resolve(blob), mimeMap[r.format], 0.92)
      })
    },
    []
  )

  const exportAsZip = useCallback(async () => {
    if (regions.length === 0) return
    const zip = new JSZip()
    for (const r of regions) {
      const blob = await regionToBlob(r)
      if (blob) zip.file(`${r.name}.${r.format}`, blob)
    }
    const zipBlob = await zip.generateAsync({ type: "blob" })
    const url = URL.createObjectURL(zipBlob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${imgName || "image"}_sliced.zip`
    a.click()
    URL.revokeObjectURL(url)
  }, [regions, regionToBlob, imgName])

  const inputStyle = {
    backgroundColor: "var(--color-surface)",
    borderColor: "var(--color-border)",
    color: "var(--color-text)",
  }

  const selectedRegion = regions.find((r) => r.id === selectedId)

  return (
    <div className="space-y-4">
      <img ref={imgRef} src={imgSrc} className="hidden" alt="" />
      <input
        ref={jsonFileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => importJson(e.target.files)}
      />

      <div
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-[var(--color-primary)]"
        style={{ borderColor: "var(--color-border)" }}
      >
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        {imgSrc ? (
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Image loaded — drag on the canvas to create regions, or click below to add a new region
          </p>
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
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 min-w-0 rounded-lg p-4" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
            <canvas
              ref={canvasRef}
              className="w-full rounded cursor-crosshair"
              style={{ maxWidth: "100%" }}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
            />
          </div>

          <div className="w-full lg:w-80 shrink-0 space-y-3">
            <div className="flex gap-2">
              <button
                onClick={addRegion}
                disabled={!imgSize.w}
                className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                + Add
              </button>
              <button
                onClick={() => setShowGridModal(true)}
                disabled={!imgSize.w}
                className="flex-1 px-3 py-2 rounded-lg text-sm font-medium border disabled:opacity-50"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
              >
                Grid
              </button>
              <button
                onClick={exportAll}
                disabled={regions.length === 0}
                className="flex-1 px-3 py-2 rounded-lg text-sm font-medium border disabled:opacity-50"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
              >
                Export All
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportAsZip}
                disabled={regions.length === 0}
                className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: "#6366f1" }}
              >
                Export ZIP
              </button>
              <button
                onClick={() => jsonFileRef.current?.click()}
                className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: "#10b981" }}
              >
                Import JSON
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportJson}
                disabled={regions.length === 0}
                className="flex-1 px-3 py-2 rounded-lg text-sm font-medium border disabled:opacity-50"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
              >
                Export JSON
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {[[64,64],[128,128],[256,256],[512,512]].map(([w,h]) => (
                <button
                  key={`${w}x${h}`}
                  onClick={() => applyPreset(w, h)}
                  className="px-2 py-1 rounded text-[10px] border"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
                >
                  {w}×{h}
                </button>
              ))}
              {[[48,48],[32,32],[192,192],[1024,1024]].map(([w,h]) => (
                <button
                  key={`${w}x${h}`}
                  onClick={() => applyPreset(w, h)}
                  className="px-2 py-1 rounded text-[10px] border"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
                >
                  {w}×{h}
                </button>
              ))}
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {regions.map((r, i) => (
                <div
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={`rounded-lg border p-3 cursor-pointer transition-colors ${
                    r.id === selectedId ? "ring-2 ring-[var(--color-primary)]" : ""
                  }`}
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <input
                      value={r.name}
                      onChange={(e) => updateRegion(r.id, { name: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm font-semibold bg-transparent border-b border-transparent hover:border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none"
                      style={{ color: "var(--color-text)", width: "120px" }}
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); removeRegion(r.id) }}
                      className="text-xs px-2 py-1 rounded hover:bg-[var(--color-bg-secondary)]"
                      style={{ color: "var(--color-error)" }}
                    >
                      Delete
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-1 mb-2">
                    <div>
                      <label className="block text-[10px] mb-0.5" style={{ color: "var(--color-text-secondary)" }}>X</label>
                      <input
                        type="number"
                        value={r.x}
                        onChange={(e) => updateRegion(r.id, { x: parseInt(e.target.value) || 0 })}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full rounded border px-2 py-1 text-xs"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] mb-0.5" style={{ color: "var(--color-text-secondary)" }}>Y</label>
                      <input
                        type="number"
                        value={r.y}
                        onChange={(e) => updateRegion(r.id, { y: parseInt(e.target.value) || 0 })}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full rounded border px-2 py-1 text-xs"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] mb-0.5" style={{ color: "var(--color-text-secondary)" }}>W</label>
                      <input
                        type="number"
                        value={r.w}
                        onChange={(e) => updateRegion(r.id, { w: parseInt(e.target.value) || 10 })}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full rounded border px-2 py-1 text-xs"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] mb-0.5" style={{ color: "var(--color-text-secondary)" }}>H</label>
                      <input
                        type="number"
                        value={r.h}
                        onChange={(e) => updateRegion(r.id, { h: parseInt(e.target.value) || 10 })}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full rounded border px-2 py-1 text-xs"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                  <div className="text-[10px] mb-2 font-medium" style={{ color: "var(--color-text-secondary)" }}>Export Size</div>
                  <div className="flex gap-2 items-end">
                    <div>
                      <label className="block text-[10px] mb-0.5" style={{ color: "var(--color-text-secondary)" }}>W</label>
                      <input
                        type="number"
                        value={r.exportW}
                        onChange={(e) => updateRegion(r.id, { exportW: parseInt(e.target.value) || 1 })}
                        onClick={(e) => e.stopPropagation()}
                        className="w-16 rounded border px-2 py-1 text-xs"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] mb-0.5" style={{ color: "var(--color-text-secondary)" }}>H</label>
                      <input
                        type="number"
                        value={r.exportH}
                        onChange={(e) => updateRegion(r.id, { exportH: parseInt(e.target.value) || 1 })}
                        onClick={(e) => e.stopPropagation()}
                        className="w-16 rounded border px-2 py-1 text-xs"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] mb-0.5" style={{ color: "var(--color-text-secondary)" }}>Format</label>
                      <select
                        value={r.format}
                        onChange={(e) => updateRegion(r.id, { format: e.target.value as Region["format"] })}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border px-2 py-1 text-xs"
                        style={inputStyle}
                      >
                        <option value="png">PNG</option>
                        <option value="jpeg">JPEG</option>
                        <option value="webp">WebP</option>
                      </select>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); exportRegion(r) }}
                      className="px-2 py-1 rounded text-xs font-medium text-white"
                      style={{ backgroundColor: "var(--color-success)" }}
                    >
                      Export
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {regions.length > 0 && (
              <p className="text-[10px] text-center" style={{ color: "var(--color-text-tertiary)" }}>
                Tip: Press Delete/Backspace to remove selected region
              </p>
            )}
          </div>
        </div>
      )}
      {showGridModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={() => setShowGridModal(false)}>
          <div className="rounded-xl p-6 w-80 space-y-4" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>Auto Grid Slicing</h3>
            <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
              Image: {imgSize.w} × {imgSize.h}
            </p>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs mb-1" style={{ color: "var(--color-text-secondary)" }}>Columns</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={gridCols}
                  onChange={(e) => setGridCols(parseInt(e.target.value) || 1)}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={inputStyle}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs mb-1" style={{ color: "var(--color-text-secondary)" }}>Rows</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={gridRows}
                  onChange={(e) => setGridRows(parseInt(e.target.value) || 1)}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={inputStyle}
                />
              </div>
            </div>
            <p className="text-[10px]" style={{ color: "var(--color-text-tertiary)" }}>
              Will create {gridCols * gridRows} regions ({Math.round(imgSize.w / gridCols)} × {Math.round(imgSize.h / gridRows)} each)
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowGridModal(false)} className="flex-1 px-3 py-2 rounded-lg text-sm font-medium border" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
                Cancel
              </button>
              <button onClick={autoGrid} className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: "var(--color-primary)" }}>
                Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function getCursorForHandle(handle: HandlePosition): string {
  const map: Record<HandlePosition, string> = {
    nw: "nw-resize",
    n: "n-resize",
    ne: "ne-resize",
    e: "e-resize",
    se: "se-resize",
    s: "s-resize",
    sw: "sw-resize",
    w: "w-resize",
  }
  return map[handle]
}
