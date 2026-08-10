import { useState, useCallback, useRef, useEffect } from 'react'
import FileDropzone from '../components/FileDropzone'
import {
  decodeAudioFile,
  sliceAudioBuffer,
  concatAudioBuffers,
  applyVolumeAndFade,
  encodeAudioBuffer,
} from '../lib/audio-export'

type Status = 'idle' | 'loading' | 'processing' | 'done' | 'error'

export default function AudioEditor() {
  const [files, setFiles] = useState<File[]>([])
  const [buffer, setBuffer] = useState<AudioBuffer | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')
  const [outputUrl, setOutputUrl] = useState('')
  const [outputName, setOutputName] = useState('')
  const [volume, setVolume] = useState(1)
  const [fadeIn, setFadeIn] = useState(0)
  const [fadeOut, setFadeOut] = useState(0)
  const [format, setFormat] = useState<'wav' | 'mp3' | 'flac'>('wav')
  const [region, setRegion] = useState<{ start: number; end: number } | null>(null)

  const wavesurferRef = useRef<import('wavesurfer.js').default | null>(null)
  const regionsRef = useRef<import('wavesurfer.js/dist/plugins/regions.js').default | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)
  const blobUrlRef = useRef<string>('')

  useEffect(() => {
    return () => {
      wavesurferRef.current?.destroy()
      audioCtxRef.current?.close()
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
    }
  }, [])

  const playBuffer = useCallback((buf: AudioBuffer) => {
    if (sourceRef.current) {
      try { sourceRef.current.stop() } catch { /* ignore */ }
    }
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioContext()
    }
    const ctx = audioCtxRef.current
    if (ctx.state === 'suspended') ctx.resume()
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.connect(ctx.destination)
    src.start(0)
    sourceRef.current = src
  }, [])

  const loadBufferIntoViewer = useCallback(async (buf: AudioBuffer, name: string) => {
    if (!containerRef.current) return
    const [WaveSurferMod, RegionsMod] = await Promise.all([
      import('wavesurfer.js'),
      import('wavesurfer.js/dist/plugins/regions.js'),
    ])
    const WaveSurfer = WaveSurferMod.default
    const Regions = RegionsMod.default
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy()
      wavesurferRef.current = null
    }
    const regions = Regions.create()
    regionsRef.current = regions
    const wavBlob = bufferToWavBlob(buf)
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
    blobUrlRef.current = URL.createObjectURL(wavBlob)
    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: 'rgba(100,116,139,0.6)',
      progressColor: 'var(--color-primary)',
      cursorColor: 'var(--color-primary)',
      height: 128,
      normalize: true,
      url: blobUrlRef.current,
      plugins: [regions],
    })
    wavesurferRef.current = ws
    ws.on('ready', () => {
      const region = regions.addRegion({ start: 0, end: buf.duration, drag: true, resize: true, color: 'rgba(59,130,246,0.15)' })
      region.on('update-end', () => setRegion({ start: region.start, end: region.end }))
      region.on('update', () => setRegion({ start: region.start, end: region.end }))
      setRegion({ start: 0, end: buf.duration })
    })
    setBuffer(buf)
    setOutputName(name.replace(/\.[^.]+$/, ''))
  }, [])

  const onFiles = useCallback(async (newFiles: File[]) => {
    if (!newFiles.length) return
    setFiles((prev) => [...prev, ...newFiles])
    if (!buffer) {
      try {
        setStatus('processing')
        setMessage(`Decoding ${newFiles[0].name}...`)
        const buf = await decodeAudioFile(newFiles[0])
        await loadBufferIntoViewer(buf, newFiles[0].name)
        setStatus('done')
        setMessage('')
      } catch (e) {
        setStatus('error')
        setMessage((e as Error).message)
      }
    }
  }, [buffer, loadBufferIntoViewer])

  const clearFiles = () => {
    setFiles([])
    setBuffer(null)
    setRegion(null)
    setOutputUrl('')
    setMessage('')
    setStatus('idle')
    wavesurferRef.current?.destroy()
    wavesurferRef.current = null
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = ''
    }
  }

  const trimSelection = useCallback(async () => {
    if (!buffer || !region) return
    setStatus('processing')
    setMessage('Trimming...')
    try {
      const sliced = sliceAudioBuffer(buffer, region.start, region.end)
      await loadBufferIntoViewer(sliced, `${outputName || 'trimmed'}.wav`)
      setRegion({ start: 0, end: sliced.duration })
      setStatus('done')
      setMessage('Trimmed to selection')
    } catch (e) {
      setStatus('error')
      setMessage((e as Error).message)
    }
  }, [buffer, region, outputName, loadBufferIntoViewer])

  const deleteSelection = useCallback(async () => {
    if (!buffer || !region) return
    setStatus('processing')
    setMessage('Deleting selection...')
    try {
      const left = sliceAudioBuffer(buffer, 0, region.start)
      const right = sliceAudioBuffer(buffer, region.end, buffer.duration)
      const merged = concatAudioBuffers([left, right].filter((b) => b.length > 0))
      await loadBufferIntoViewer(merged, `${outputName || 'edited'}.wav`)
      setStatus('done')
      setMessage('Selection deleted')
    } catch (e) {
      setStatus('error')
      setMessage((e as Error).message)
    }
  }, [buffer, region, outputName, loadBufferIntoViewer])

  const mergeAll = useCallback(async () => {
    if (files.length < 2) {
      setMessage('Add at least 2 files to merge')
      return
    }
    setStatus('processing')
    setMessage(`Merging ${files.length} files...`)
    try {
      const buffers = await Promise.all(files.map(decodeAudioFile))
      const merged = concatAudioBuffers(buffers)
      await loadBufferIntoViewer(merged, 'merged.wav')
      setStatus('done')
      setMessage(`Merged ${files.length} files`)
    } catch (e) {
      setStatus('error')
      setMessage((e as Error).message)
    }
  }, [files, loadBufferIntoViewer])

  const applyFx = useCallback(async () => {
    if (!buffer) return
    setStatus('processing')
    setMessage('Applying volume & fade...')
    try {
      const result = await applyVolumeAndFade(buffer, volume, fadeIn, fadeOut)
      await loadBufferIntoViewer(result, `${outputName || 'edited'}.wav`)
      setStatus('done')
      setMessage('Applied')
    } catch (e) {
      setStatus('error')
      setMessage((e as Error).message)
    }
  }, [buffer, volume, fadeIn, fadeOut, outputName, loadBufferIntoViewer])

  const exportFile = useCallback(async () => {
    if (!buffer) return
    setStatus('processing')
    setMessage(`Exporting as ${format.toUpperCase()}...`)
    try {
      const blob = await encodeAudioBuffer(buffer, format)
      const url = URL.createObjectURL(blob)
      setOutputUrl(url)
      setStatus('done')
      setMessage('Exported')
    } catch (e) {
      setStatus('error')
      setMessage((e as Error).message)
    }
  }, [buffer, format])

  return (
    <div className="space-y-5 text-[var(--color-text)]">
      <FileDropzone
        accept="audio/*"
        multiple
        onFiles={onFiles}
        hint="Drop one or more audio files. First file loads in the editor; multiple files enable Merge."
      />
      {files.length > 0 && (
        <div className="text-sm text-[var(--color-text-secondary)]">
          {files.length} file(s): {files.map((f) => f.name).join(', ')}
        </div>
      )}

      {buffer && (
        <>
          <div ref={containerRef} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]" />
          {region && (
            <div className="text-xs text-[var(--color-text-secondary)]">
              Selection: {region.start.toFixed(2)}s — {region.end.toFixed(2)}s ({(region.end - region.start).toFixed(2)}s)
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button onClick={() => buffer && playBuffer(buffer)} className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-[var(--color-bg-secondary)]">
              Play
            </button>
            <button onClick={trimSelection} className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-[var(--color-bg-secondary)]">
              Trim to selection
            </button>
            <button onClick={deleteSelection} className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-[var(--color-bg-secondary)]">
              Delete selection
            </button>
            <button onClick={mergeAll} disabled={files.length < 2} className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-[var(--color-bg-secondary)] disabled:opacity-40">
              Merge all
            </button>
            <button onClick={clearFiles} className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-[var(--color-bg-secondary)]">
              Clear
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:grid-cols-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-[var(--color-text-secondary)]">Volume: {volume.toFixed(2)}x</span>
              <input type="range" min={0} max={2} step={0.05} value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-[var(--color-text-secondary)]">Fade in: {fadeIn.toFixed(1)}s</span>
              <input type="range" min={0} max={10} step={0.1} value={fadeIn} onChange={(e) => setFadeIn(parseFloat(e.target.value))} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-[var(--color-text-secondary)]">Fade out: {fadeOut.toFixed(1)}s</span>
              <input type="range" min={0} max={10} step={0.1} value={fadeOut} onChange={(e) => setFadeOut(parseFloat(e.target.value))} />
            </label>
          </div>
          <button
            onClick={applyFx}
            className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary)]/90"
          >
            Apply volume & fade
          </button>

          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <span className="text-sm text-[var(--color-text-secondary)]">Export as:</span>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as 'wav' | 'mp3' | 'flac')}
              className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-sm"
            >
              <option value="wav">WAV</option>
              <option value="mp3">MP3</option>
              <option value="flac">FLAC</option>
            </select>
            <button
              onClick={exportFile}
              className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary)]/90"
            >
              Export
            </button>
          </div>
        </>
      )}

      {message && (
        <div className="rounded-lg bg-[var(--color-bg-secondary)] p-3 text-sm text-[var(--color-text-secondary)]">
          {message}
        </div>
      )}
      {outputUrl && (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <audio controls src={outputUrl} className="mb-3 w-full" />
          <a
            href={outputUrl}
            download={`${outputName || 'output'}.${format}`}
            className="inline-block rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary)]/90"
          >
            Download {outputName || 'output'}.{format}
          </a>
        </div>
      )}
    </div>
  )
}

function bufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const length = buffer.length
  const blockAlign = numChannels * 2
  const byteRate = sampleRate * blockAlign
  const dataSize = length * blockAlign
  const totalSize = 44 + dataSize
  const ab = new ArrayBuffer(totalSize)
  const view = new DataView(ab)
  const writeStr = (off: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)) }
  writeStr(0, 'RIFF'); view.setUint32(4, totalSize - 8, true); writeStr(8, 'WAVE')
  writeStr(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true)
  view.setUint16(22, numChannels, true); view.setUint32(24, sampleRate, true)
  view.setUint32(28, byteRate, true); view.setUint16(32, blockAlign, true); view.setUint16(34, 16, true)
  writeStr(36, 'data'); view.setUint32(40, dataSize, true)
  const channels: Float32Array[] = []
  for (let c = 0; c < numChannels; c++) channels.push(buffer.getChannelData(c))
  let off = 44
  for (let i = 0; i < length; i++) {
    for (let c = 0; c < numChannels; c++) {
      let s = Math.max(-1, Math.min(1, channels[c][i]))
      view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true)
      off += 2
    }
  }
  return new Blob([ab], { type: 'audio/wav' })
}
