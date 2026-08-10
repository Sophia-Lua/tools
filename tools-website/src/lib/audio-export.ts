import { getFFmpeg } from './ffmpeg-loader'
import { fetchFile } from '@ffmpeg/util'

export async function audioFileToUint8(file: File): Promise<Uint8Array> {
  return fetchFile(file)
}

export async function encodeAudioBuffer(
  buffer: AudioBuffer,
  format: 'wav' | 'mp3' | 'flac' | 'ogg'
): Promise<Blob> {
  if (format === 'wav') {
    return encodeWav(buffer)
  }
  const wav = encodeWav(buffer)
  const ffmpeg = await getFFmpeg()
  await ffmpeg.writeFile('in.wav', new Uint8Array(await wav.arrayBuffer()))
  const args = ['-i', 'in.wav']
  if (format === 'mp3') args.push('-b:a', '192k')
  args.push(`out.${format}`)
  await ffmpeg.exec(args)
  const data = (await ffmpeg.readFile(`out.${format}`)) as Uint8Array
  await ffmpeg.deleteFile('in.wav')
  await ffmpeg.deleteFile(`out.${format}`)
  return new Blob([data as unknown as BlobPart], { type: `audio/${format}` })
}

function encodeWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const length = buffer.length
  const bytesPerSample = 2
  const blockAlign = numChannels * bytesPerSample
  const byteRate = sampleRate * blockAlign
  const dataSize = length * blockAlign
  const headerSize = 44
  const totalSize = headerSize + dataSize
  const arrayBuffer = new ArrayBuffer(totalSize)
  const view = new DataView(arrayBuffer)

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
  }

  writeString(0, 'RIFF')
  view.setUint32(4, totalSize - 8, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, byteRate, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, 16, true)
  writeString(36, 'data')
  view.setUint32(40, dataSize, true)

  const channels: Float32Array[] = []
  for (let c = 0; c < numChannels; c++) channels.push(buffer.getChannelData(c))
  let offset = 44
  for (let i = 0; i < length; i++) {
    for (let c = 0; c < numChannels; c++) {
      let sample = channels[c][i]
      sample = Math.max(-1, Math.min(1, sample))
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
      offset += 2
    }
  }
  return new Blob([arrayBuffer], { type: 'audio/wav' })
}

export async function decodeAudioFile(file: File): Promise<AudioBuffer> {
  const arrayBuffer = await file.arrayBuffer()
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  const ctx = new AudioCtx()
  try {
    return await ctx.decodeAudioData(arrayBuffer.slice(0))
  } finally {
    ctx.close()
  }
}

export function sliceAudioBuffer(buffer: AudioBuffer, startSec: number, endSec: number): AudioBuffer {
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  const ctx = new AudioCtx()
  const startSample = Math.floor(startSec * buffer.sampleRate)
  const endSample = Math.min(Math.floor(endSec * buffer.sampleRate), buffer.length)
  const frameCount = Math.max(0, endSample - startSample)
  const out = ctx.createBuffer(buffer.numberOfChannels, frameCount, buffer.sampleRate)
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const src = buffer.getChannelData(c)
    out.copyToChannel(src.subarray(startSample, endSample), c)
  }
  ctx.close()
  return out
}

export function concatAudioBuffers(buffers: AudioBuffer[]): AudioBuffer {
  if (buffers.length === 0) throw new Error('No buffers to merge')
  const sampleRate = buffers[0].sampleRate
  const numChannels = buffers[0].numberOfChannels
  const totalLength = buffers.reduce((s, b) => s + b.length, 0)
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  const ctx = new AudioCtx()
  const out = ctx.createBuffer(numChannels, totalLength, sampleRate)
  let offset = 0
  for (const buf of buffers) {
    for (let c = 0; c < numChannels; c++) {
      out.copyToChannel(buf.getChannelData(c), c, offset)
    }
    offset += buf.length
  }
  ctx.close()
  return out
}

export async function applyVolumeAndFade(
  buffer: AudioBuffer,
  volume: number,
  fadeInSec: number,
  fadeOutSec: number
): Promise<AudioBuffer> {
  const AudioCtx = window.OfflineAudioContext || (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext }).webkitOfflineAudioContext
  const ctx = new AudioCtx(buffer.numberOfChannels, buffer.length, buffer.sampleRate)
  const source = ctx.createBufferSource()
  source.buffer = buffer
  const gain = ctx.createGain()
  const duration = buffer.duration
  gain.gain.setValueAtTime(0, 0)
  const fadeInEnd = Math.min(fadeInSec, duration)
  const fadeOutStart = Math.max(0, duration - fadeOutSec)
  if (fadeInEnd > 0) {
    gain.gain.linearRampToValueAtTime(volume, fadeInEnd)
  } else {
    gain.gain.setValueAtTime(volume, 0)
  }
  gain.gain.setValueAtTime(volume, fadeOutStart)
  if (fadeOutSec > 0) {
    gain.gain.linearRampToValueAtTime(0, duration)
  }
  source.connect(gain).connect(ctx.destination)
  source.start(0)
  return ctx.startRendering()
}
