export type Category = 'text' | 'image' | 'dev' | 'file' | 'utility'

export interface ToolDef {
  slug: string
  titleKey: string
  descKey: string
  category: Category
  icon: string
  keywords: string[]
}

export const categories: { id: Category; icon: string }[] = [
  { id: 'text', icon: 'FileText' },
  { id: 'image', icon: 'Image' },
  { id: 'dev', icon: 'Code2' },
  { id: 'file', icon: 'FileUp' },
  { id: 'utility', icon: 'Wrench' },
]

export const tools: ToolDef[] = [
  { slug: 'json-formatter', titleKey: 'tools.json-formatter.name', descKey: 'tools.json-formatter.desc', category: 'text', icon: 'Braces', keywords: ['json', 'format', 'validate'] },
  { slug: 'base64-codec', titleKey: 'tools.base64-codec.name', descKey: 'tools.base64-codec.desc', category: 'text', icon: 'Binary', keywords: ['base64', 'encode', 'decode'] },
  { slug: 'url-codec', titleKey: 'tools.url-codec.name', descKey: 'tools.url-codec.desc', category: 'text', icon: 'Link', keywords: ['url', 'encode', 'decode'] },
  { slug: 'markdown-preview', titleKey: 'tools.markdown-preview.name', descKey: 'tools.markdown-preview.desc', category: 'text', icon: 'FileText', keywords: ['markdown', 'preview', 'md'] },
  { slug: 'regex-tester', titleKey: 'tools.regex-tester.name', descKey: 'tools.regex-tester.desc', category: 'text', icon: 'Regex', keywords: ['regex', 'pattern', 'test'] },
  { slug: 'yaml-formatter', titleKey: 'tools.yaml-formatter.name', descKey: 'tools.yaml-formatter.desc', category: 'text', icon: 'FileCode', keywords: ['yaml', 'format', 'yml'] },
  { slug: 'text-diff', titleKey: 'tools.text-diff.name', descKey: 'tools.text-diff.desc', category: 'text', icon: 'GitCompare', keywords: ['diff', 'compare', 'text'] },
  { slug: 'image-compressor', titleKey: 'tools.image-compressor.name', descKey: 'tools.image-compressor.desc', category: 'image', icon: 'Minimize2', keywords: ['image', 'compress', 'resize'] },
  { slug: 'image-converter', titleKey: 'tools.image-converter.name', descKey: 'tools.image-converter.desc', category: 'image', icon: 'RefreshCw', keywords: ['image', 'convert', 'format'] },
  { slug: 'image-cropper', titleKey: 'tools.image-cropper.name', descKey: 'tools.image-cropper.desc', category: 'image', icon: 'Crop', keywords: ['image', 'crop', 'resize'] },
  { slug: 'image-metadata', titleKey: 'tools.image-metadata.name', descKey: 'tools.image-metadata.desc', category: 'image', icon: 'Info', keywords: ['image', 'metadata', 'exif'] },
  { slug: 'hash-generator', titleKey: 'tools.hash-generator.name', descKey: 'tools.hash-generator.desc', category: 'dev', icon: 'Hash', keywords: ['hash', 'md5', 'sha'] },
  { slug: 'jwt-decoder', titleKey: 'tools.jwt-decoder.name', descKey: 'tools.jwt-decoder.desc', category: 'dev', icon: 'Key', keywords: ['jwt', 'token', 'decode'] },
  { slug: 'color-converter', titleKey: 'tools.color-converter.name', descKey: 'tools.color-converter.desc', category: 'dev', icon: 'Palette', keywords: ['color', 'hex', 'rgb', 'hsl'] },
  { slug: 'css-unit-converter', titleKey: 'tools.css-unit-converter.name', descKey: 'tools.css-unit-converter.desc', category: 'dev', icon: 'Ruler', keywords: ['css', 'unit', 'px', 'rem'] },
  { slug: 'password-generator', titleKey: 'tools.password-generator.name', descKey: 'tools.password-generator.desc', category: 'dev', icon: 'Lock', keywords: ['password', 'generate', 'random'] },
  { slug: 'pdf-merger', titleKey: 'tools.pdf-merger.name', descKey: 'tools.pdf-merger.desc', category: 'file', icon: 'Merge', keywords: ['pdf', 'merge', 'combine'] },
  { slug: 'pdf-splitter', titleKey: 'tools.pdf-splitter.name', descKey: 'tools.pdf-splitter.desc', category: 'file', icon: 'Scissors', keywords: ['pdf', 'split', 'extract'] },
  { slug: 'docx-converter', titleKey: 'tools.docx-converter.name', descKey: 'tools.docx-converter.desc', category: 'file', icon: 'FileText', keywords: ['docx', 'word', 'html'] },
  { slug: 'xlsx-converter', titleKey: 'tools.xlsx-converter.name', descKey: 'tools.xlsx-converter.desc', category: 'file', icon: 'Table', keywords: ['xlsx', 'excel', 'csv'] },
  { slug: 'csv-viewer', titleKey: 'tools.csv-viewer.name', descKey: 'tools.csv-viewer.desc', category: 'file', icon: 'Table', keywords: ['csv', 'viewer', 'edit'] },
  { slug: 'zip-viewer', titleKey: 'tools.zip-viewer.name', descKey: 'tools.zip-viewer.desc', category: 'file', icon: 'Archive', keywords: ['zip', 'gzip', 'archive'] },
  { slug: 'qr-generator', titleKey: 'tools.qr-generator.name', descKey: 'tools.qr-generator.desc', category: 'utility', icon: 'QrCode', keywords: ['qr', 'qrcode', 'generate'] },
  { slug: 'datetime-tool', titleKey: 'tools.datetime-tool.name', descKey: 'tools.datetime-tool.desc', category: 'utility', icon: 'Calendar', keywords: ['date', 'time', 'timestamp'] },
  { slug: 'text-stats', titleKey: 'tools.text-stats.name', descKey: 'tools.text-stats.desc', category: 'utility', icon: 'BarChart3', keywords: ['text', 'stats', 'count'] },
  { slug: 'number-converter', titleKey: 'tools.number-converter.name', descKey: 'tools.number-converter.desc', category: 'utility', icon: 'Hash', keywords: ['number', 'base', 'convert'] },
  { slug: 'uuid-generator', titleKey: 'tools.uuid-generator.name', descKey: 'tools.uuid-generator.desc', category: 'utility', icon: 'Fingerprint', keywords: ['uuid', 'guid', 'generate'] },
  { slug: 'lorem-generator', titleKey: 'tools.lorem-generator.name', descKey: 'tools.lorem-generator.desc', category: 'utility', icon: 'AlignLeft', keywords: ['lorem', 'ipsum', 'placeholder'] },
]

export function getToolsByCategory(category: Category): ToolDef[] {
  return tools.filter(t => t.category === category)
}

export function getToolBySlug(slug: string): ToolDef | undefined {
  return tools.find(t => t.slug === slug)
}
