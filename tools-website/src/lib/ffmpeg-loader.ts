import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL } from '@ffmpeg/util'

let instance: FFmpeg | null = null
let loading: Promise<FFmpeg> | null = null
const CORE_VERSION = '0.12.10'
const BASE = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/umd`

export interface FFmpegProgress {
  progress: number
  time: number
}

export function getFFmpeg(onLog?: (m: string) => void): Promise<FFmpeg> {
  if (instance) return Promise.resolve(instance)
  if (loading) return loading
  loading = (async () => {
    const ffmpeg = new FFmpeg()
    if (onLog) ffmpeg.on('log', ({ message }) => onLog(message))
    await ffmpeg.load({
      coreURL: await toBlobURL(`${BASE}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${BASE}/ffmpeg-core.wasm`, 'application/wasm'),
    })
    instance = ffmpeg
    return ffmpeg
  })()
  return loading
}

export function extensionFor(format: string): string {
  switch (format) {
    case 'mp3': return 'mp3'
    case 'wav': return 'wav'
    case 'ogg': return 'ogg'
    case 'flac': return 'flac'
    case 'aac': return 'aac'
    case 'm4a': return 'm4a'
    case 'webm': return 'webm'
    default: return format
  }
}

export function mimeFor(format: string): string {
  switch (format) {
    case 'mp3': return 'audio/mpeg'
    case 'wav': return 'audio/wav'
    case 'ogg': return 'audio/ogg'
    case 'flac': return 'audio/flac'
    case 'aac': return 'audio/aac'
    case 'm4a': return 'audio/mp4'
    case 'webm': return 'audio/webm'
    default: return 'audio/wav'
  }
}
