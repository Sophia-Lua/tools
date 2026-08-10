import { useState, useCallback, useRef, useEffect } from 'react'
import FileDropzone from '../components/FileDropzone'

const MODELS = [
  { id: 'Xenova/whisper-tiny', label: 'Tiny multilingual (~40 MB)' },
  { id: 'Xenova/whisper-tiny.en', label: 'Tiny English-only (~40 MB, faster)' },
] as const

type Status = 'idle' | 'loading-model' | 'processing' | 'done' | 'error'

export default function AudioTranscriber() {
  const [file, setFile] = useState<File | null>(null)
  const [recordedUrl, setRecordedUrl] = useState<string>('')
  const [modelId, setModelId] = useState<string>(MODELS[0].id)
  const [language, setLanguage] = useState<string>('')
  const [status, setStatus] = useState<Status>('idle')
  const [progress, setProgress] = useState('')
  const [text, setText] = useState('')
  const [chunks, setChunks] = useState<{ start: number; end?: number; text: string }[]>([])
  const [recording, setRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const transcriberRef = useRef<unknown>(null)
  const abortRef = useRef(false)

  useEffect(() => {
    return () => {
      if (recordedUrl) URL.revokeObjectURL(recordedUrl)
    }
  }, [recordedUrl])

  const onFiles = useCallback((files: File[]) => {
    if (!files.length) return
    setFile(files[0])
    setText('')
    setChunks([])
    setProgress('')
    setStatus('idle')
  }, [])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        if (recordedUrl) URL.revokeObjectURL(recordedUrl)
        setRecordedUrl(url)
        const f = new File([blob], `recording-${Date.now()}.webm`, { type: 'audio/webm' })
        setFile(f)
        stream.getTracks().forEach((t) => t.stop())
      }
      mediaRecorderRef.current = recorder
      recorder.start()
      setRecording(true)
    } catch (e) {
      alert(`Microphone error: ${(e as Error).message}`)
    }
  }, [recordedUrl])

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }, [])

  const transcribe = useCallback(async () => {
    if (!file) return
    abortRef.current = false
    setStatus('loading-model')
    setProgress('Loading transformers.js...')
    setText('')
    setChunks([])
    try {
      const transformersMod = await import('@huggingface/transformers')
      const { pipeline, env } = transformersMod
      env.allowLocalModels = false
      setProgress(`Downloading model ${modelId} (cached after first run)...`)
      setStatus('loading-model')
      const pipe = await pipeline('automatic-speech-recognition', modelId, {
        progress_callback: (p: { status: string; progress?: number; file?: string }) => {
          if (p.status === 'progress' && typeof p.progress === 'number') {
            setProgress(`${p.file ?? 'model'}: ${p.progress.toFixed(1)}%`)
          } else {
            setProgress(p.status)
          }
        },
      })
      transcriberRef.current = pipe
      setStatus('processing')
      setProgress('Transcribing...')
      const arrayBuffer = await file.arrayBuffer()
      const audioData = new Float32Array(arrayBuffer)
      const resampled = await resampleIfNeeded(audioData, file)
      if (abortRef.current) {
        setProgress('Cancelled')
        setStatus('idle')
        return
      }
      const options: Record<string, unknown> = {
        chunk_length_s: 30,
        stride_length_s: 5,
        return_timestamps: true,
      }
      if (language) options.language = language
      const fn = pipe as unknown as (input: Float32Array, opts: Record<string, unknown>) => Promise<TranscriptionResult>
      const result = await fn(resampled, options)
      setText(result.text ?? '')
      if (result.chunks) setChunks(result.chunks)
      setStatus('done')
      setProgress('Done')
    } catch (e) {
      setProgress(`Error: ${(e as Error).message}`)
      setStatus('error')
    }
  }, [file, modelId, language])

  const cancel = useCallback(() => {
    abortRef.current = true
    setProgress('Cancelling...')
  }, [])

  const copyToClipboard = useCallback(async () => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setProgress('Copied to clipboard')
    } catch {
      setProgress('Copy failed')
    }
  }, [text])

  const downloadSrt = useCallback(() => {
    if (!chunks.length) return
    const srt = chunks
      .map((c, i) => {
        const start = formatSrtTime(c.start)
        const end = formatSrtTime(c.end ?? c.start + 1)
        return `${i + 1}\n${start} --> ${end}\n${c.text.trim()}\n`
      })
      .join('\n')
    const blob = new Blob([srt], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${file?.name.replace(/\.[^.]+$/, '') ?? 'transcript'}.srt`
    a.click()
    URL.revokeObjectURL(url)
  }, [chunks, file])

  const audioUrl = file ? (recordedUrl && file.name.startsWith('recording-') ? recordedUrl : URL.createObjectURL(file)) : ''

  return (
    <div className="space-y-5 text-[var(--color-text)]">
      <FileDropzone accept="audio/*" onFiles={onFiles} hint="Drop an audio file or record from microphone" />

      <div className="flex flex-wrap items-center gap-3">
        {!recording ? (
          <button
            onClick={startRecording}
            className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm hover:bg-[var(--color-bg-secondary)]"
          >
            <span className="inline-block h-3 w-3 rounded-full bg-red-500" />
            Record from microphone
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white"
          >
            <span className="inline-block h-3 w-3 rounded-sm bg-white" />
            Stop recording
          </button>
        )}
      </div>

      {file && audioUrl && (
        <div className="space-y-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="text-sm">
            <span className="text-[var(--color-text-secondary)]">Source: </span>
            <span className="font-medium">{file.name}</span>
          </div>
          <audio controls src={audioUrl} className="w-full" />
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--color-text-secondary)]">Model</span>
          <select
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2"
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--color-text-secondary)]">Language hint (optional)</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2"
          >
            <option value="">Auto-detect</option>
            <option value="en">English</option>
            <option value="zh">Chinese</option>
            <option value="ja">Japanese</option>
            <option value="ko">Korean</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={transcribe}
          disabled={!file || status === 'loading-model' || status === 'processing'}
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary)]/90 disabled:opacity-50"
        >
          {status === 'loading-model'
            ? 'Loading model...'
            : status === 'processing'
              ? 'Transcribing...'
              : 'Transcribe'}
        </button>
        {(status === 'loading-model' || status === 'processing') && (
          <button
            onClick={cancel}
            className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm hover:bg-[var(--color-bg-secondary)]"
          >
            Cancel
          </button>
        )}
      </div>

      {progress && (
        <div className="rounded-lg bg-[var(--color-bg-secondary)] p-3 text-sm text-[var(--color-text-secondary)]">
          {progress}
        </div>
      )}

      {text && (
        <div className="space-y-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Transcript</p>
            <div className="flex gap-2">
              <button
                onClick={copyToClipboard}
                className="rounded-md border border-[var(--color-border)] px-2 py-1 text-xs hover:bg-[var(--color-bg-secondary)]"
              >
                Copy
              </button>
              {chunks.length > 0 && (
                <button
                  onClick={downloadSrt}
                  className="rounded-md border border-[var(--color-border)] px-2 py-1 text-xs hover:bg-[var(--color-bg-secondary)]"
                >
                  Download SRT
                </button>
              )}
            </div>
          </div>
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded bg-[var(--color-bg-secondary)] p-3 text-sm">
            {text}
          </pre>
          {chunks.length > 0 && (
            <details className="text-sm">
              <summary className="cursor-pointer text-[var(--color-text-secondary)]">
                Timestamps ({chunks.length} chunks)
              </summary>
              <ul className="mt-2 space-y-1">
                {chunks.map((c, i) => (
                  <li key={i} className="flex gap-2 text-xs">
                    <span className="shrink-0 font-mono text-[var(--color-primary)]">
                      {formatTime(c.start)} – {formatTime(c.end ?? c.start + 1)}
                    </span>
                    <span className="text-[var(--color-text)]">{c.text.trim()}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  )
}

interface TranscriptionResult {
  text: string
  chunks?: { start: number; end?: number; text: string }[]
}

function formatTime(sec: number): string {
  if (!isFinite(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatSrtTime(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  const ms = Math.floor((sec - Math.floor(sec)) * 1000)
  return `${pad(h)}:${pad(m)}:${pad(s)},${ms.toString().padStart(3, '0')}`
}

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

async function resampleIfNeeded(audio: Float32Array, file: File): Promise<Float32Array> {
  try {
    const buffer = await file.arrayBuffer()
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AudioCtx()
    try {
      const decoded = await ctx.decodeAudioData(buffer.slice(0))
      if (decoded.sampleRate === 16000 && decoded.numberOfChannels === 1) {
        return decoded.getChannelData(0).slice()
      }
      const offline = new OfflineAudioContext(1, Math.ceil(decoded.duration * 16000), 16000)
      const src = offline.createBufferSource()
      src.buffer = decoded
      src.connect(offline.destination)
      src.start(0)
      const resampled = await offline.startRendering()
      return resampled.getChannelData(0).slice()
    } finally {
      ctx.close()
    }
  } catch {
    return audio
  }
}
