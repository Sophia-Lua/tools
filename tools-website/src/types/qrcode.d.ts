declare module 'qrcode' {
  export interface QRCodeToDataURLOptions {
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
    type?: string
    quality?: number
    margin?: number
    scale?: number
    width?: number
    color?: {
      dark?: string
      light?: string
    }
  }
  export function toDataURL(text: string, options?: QRCodeToDataURLOptions): Promise<string>
  export function toString(text: string, options?: QRCodeToDataURLOptions & { type: 'svg' }): Promise<string>
  const _default: {
    toDataURL: typeof toDataURL
    toString: typeof toString
  }
  export default _default
}
