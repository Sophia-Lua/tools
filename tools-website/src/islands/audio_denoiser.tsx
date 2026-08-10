import { useState, useCallback, useRef } from 'react'
import FileDropzone from '../components/FileDropzone'
import { getFFmpeg, mimeFor } from '../lib/ffmpeg-loader'
import { fetchFile } from '@ffmpeg/util'

const FORMATS = ['wav', 'mp3', 'flac', 'ogg'] as const
type OutFormat = (typeof FORMATS)[number]

export default function AudioDenoiser() {
  const [file, setFile] = useState<File | null>(null)
  const [noiseFloor, setNoiseFloor] = useState(-25)
  const [tonality, setTonality] = useState(true)
  const [outFormat, setOutFormat] = useState<OutFormat>('wav')
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

  const process = useCallback(async () => {
    if (!file) return
    setStatus('loading')
    setLog([])
    setOutputUrl('')
    try {
      addLog('Loading audio engine...')
      const ffmpeg = await getFFmpeg(addLog)
      setStatus('processing')
      const inExt = file.name.split('.').pop() || 'wav'
      const inName = `input.${inExt}`
      const outName = `output.${outFormat}`
      addLog(`Reading ${file.name}...`)
      await ffmpeg.writeFile(inName, await fetchFile(file))
      const filter = `afftdn=nf=${noiseFloor}:tn=${tonality ? 1 : 0}`
      const args = ['-i', inName, '-af', filter]
      if (outFormat === 'mp3') args.push('-b:a', '192k')
      args.push(outName)
      addLog(`Running: ffmpeg ${args.join(' ')}`)
      await ffmpeg.exec(args)
      const data = (await ffmpeg.readFile(outName)) as Uint8Array
      const blob = new Blob([data as unknown as BlobPart], { type: mimeFor(outFormat) })
      if (outputRef.current) URL.revokeObjectURL(outputRef.current)
      const url = URL.createObjectURL(blob)
      outputRef.current = url
      setOutputUrl(url)
      const baseName = file.name.replace(/\.[^.]+$/, '')
      setOutputName(`${baseName}.denoised.${outFormat}`)
      await ffmpeg.deleteFile(inName)
      await ffmpeg.deleteFile(outName)
      addLog(`Done. Output size: ${(blob.size / 1024).toFixed(1)} KB`)
      setStatus('done')
    } catch (e) {
      addLog(`Error: ${(e as Error).message}`)
      setStatus('error')
    }
  }, [file, noiseFloor, tonality, outFormat, addLog])

  return (
    <div className="space-y-5 text-[var(--color-text)]">
      <FileDropzone accept="audio/*" onFiles={onFiles} hint="Drop a speech recording to denoise" />
      {file && (
        <div className="space-y-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="text-sm">
            <span className="text-[var(--color-text-secondary)]">Input: </span>
            <span className="font-medium">{file.name}</span>
          </div>
          <audio controls src={URL.createObjectURL(file)} className="w-full" />

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[var(--color-text-secondary)]">
              Noise floor: <span className="font-mono">{noiseFloor} dB</span>
              <span className="ml-2 text-xs">(lower = less aggressive)</span>
            </span>
            <input
              type="range"
              min={-80}
              max={0}
              step={1}
              value={noiseFloor}
              onChange={(e) => setNoiseFloor(parseInt(e.target.value))}
            />
            <div className="flex justify-between text-xs text-[var(--color-text-secondary)]">
              <span>-80 dB (gentle)</span>
              <span>0 dB (aggressive)</span>
            </div>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={tonality}
              onChange={(e) => setTonality(e.target.checked)}
              className="h-4 w-4"
            />
            <span>Track noise tonality (helps with non-stationary noise)</span>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[var(--color-text-secondary)]">Output format</span>
            <select
              value={outFormat}
              onChange={(e) => setOutFormat(e.target.value as OutFormat)}
              className="max-w-xs rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2"
            >
              {FORMATS.map((f) => (
                <option key={f} value={f}>
                  .{f.toUpperCase()}
                </option>
              ))}
            </select>
          </label>

          <button
            onClick={process}
            disabled={status === 'loading' || status === 'processing'}
            className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary)]/90 disabled:opacity-50"
          >
            {status === 'loading'
              ? 'Loading engine...'
              : status === 'processing'
                ? 'Processing...'
                : 'Denoise'}
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
          <p className="mb-3 text-sm font-medium">Denoised output</p>
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
