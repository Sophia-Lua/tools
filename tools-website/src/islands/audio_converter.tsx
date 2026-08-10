import { useState, useCallback, useRef } from 'react'
import FileDropzone from '../components/FileDropzone'
import { getFFmpeg, extensionFor, mimeFor } from '../lib/ffmpeg-loader'
import { fetchFile } from '@ffmpeg/util'

const FORMATS = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'webm'] as const
type Format = (typeof FORMATS)[number]

const LOSSY: Format[] = ['mp3', 'ogg', 'aac', 'm4a']
const BITRATES = ['96k', '128k', '192k', '256k', '320k']

export default function AudioConverter() {
  const [file, setFile] = useState<File | null>(null)
  const [format, setFormat] = useState<Format>('mp3')
  const [bitrate, setBitrate] = useState('192k')
  const [status, setStatus] = useState<'idle' | 'loading' | 'processing' | 'done' | 'error'>('idle')
  const [outputUrl, setOutputUrl] = useState('')
  const [outputName, setOutputName] = useState('')
  const [log, setLog] = useState<string[]>([])
  const logRef = useRef<HTMLPreElement>(null)
  const outputRef = useRef<string>('')

  const addLog = useCallback((line: string) => {
    setLog((prev) => {
      const next = [...prev, line].slice(-80)
      if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
      return next
    })
  }, [])

  const onFiles = useCallback((files: File[]) => {
    if (!files.length) return
    setFile(files[0])
    setOutputUrl('')
    setLog([])
    setStatus('idle')
  }, [])

  const convert = useCallback(async () => {
    if (!file) return
    setStatus('loading')
    setLog([])
    setOutputUrl('')
    try {
      addLog('Loading audio engine (one-time download ~32 MB)...')
      const ffmpeg = await getFFmpeg(addLog)
      setStatus('processing')
      addLog(`Reading ${file.name}...`)
      const inExt = file.name.split('.').pop() || 'wav'
      const inName = `input.${inExt}`
      const outExt = extensionFor(format)
      const outName = `output.${outExt}`
      await ffmpeg.writeFile(inName, await fetchFile(file))
      const args = ['-i', inName]
      if (LOSSY.includes(format)) args.push('-b:a', bitrate)
      if (format === 'wav') args.push('-ar', '44100')
      args.push(outName)
      addLog(`Running: ffmpeg ${args.join(' ')}`)
      await ffmpeg.exec(args)
      const data = (await ffmpeg.readFile(outName)) as Uint8Array
      const blob = new Blob([data as unknown as BlobPart], { type: mimeFor(format) })
      if (outputRef.current) URL.revokeObjectURL(outputRef.current)
      const url = URL.createObjectURL(blob)
      outputRef.current = url
      setOutputUrl(url)
      const baseName = file.name.replace(/\.[^.]+$/, '')
      setOutputName(`${baseName}.${outExt}`)
      await ffmpeg.deleteFile(inName)
      await ffmpeg.deleteFile(outName)
      addLog(`Done. Output size: ${(blob.size / 1024).toFixed(1)} KB`)
      setStatus('done')
    } catch (e) {
      addLog(`Error: ${(e as Error).message}`)
      setStatus('error')
    }
  }, [file, format, bitrate, addLog])

  return (
    <div className="space-y-5 text-[var(--color-text)]">
      <FileDropzone accept="audio/*" onFiles={onFiles} hint="Drop an audio file to convert" />
      {file && (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="mb-3 text-sm">
            <span className="text-[var(--color-text-secondary)]">Input: </span>
            <span className="font-medium">{file.name}</span>
            <span className="ml-2 text-[var(--color-text-secondary)]">
              ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </span>
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-[var(--color-text-secondary)]">Output format</span>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as Format)}
                className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2"
              >
                {FORMATS.map((f) => (
                  <option key={f} value={f}>
                    .{f.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>
            {LOSSY.includes(format) && (
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-[var(--color-text-secondary)]">Bitrate</span>
                <select
                  value={bitrate}
                  onChange={(e) => setBitrate(e.target.value)}
                  className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2"
                >
                  {BITRATES.map((b) => (
                    <option key={b} value={b}>
                      {b}bps
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <button
            onClick={convert}
            disabled={status === 'loading' || status === 'processing'}
            className="mt-4 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary)]/90 disabled:opacity-50"
          >
            {status === 'loading'
              ? 'Loading engine...'
              : status === 'processing'
                ? 'Converting...'
                : 'Convert'}
          </button>
        </div>
      )}
      {log.length > 0 && (
        <pre
          ref={logRef}
          className="max-h-48 overflow-auto rounded-lg bg-[var(--color-bg-secondary)] p-3 text-xs text-[var(--color-text-secondary)]"
        >
          {log.join('\n')}
        </pre>
      )}
      {status === 'done' && outputUrl && (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="mb-3 text-sm font-medium">Output</p>
          <audio controls src={outputUrl} className="mb-3 w-full" />
          <a
            href={outputUrl}
            download={outputName}
            className="inline-block rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary)]/90"
          >
            Download {outputName}
          </a>
        </div>
      )}
    </div>
  )
}
