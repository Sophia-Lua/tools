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
  { slug: 'image-slicer', titleKey: 'tools.image-slicer.name', descKey: 'tools.image-slicer.desc', category: 'image', icon: 'Scissors', keywords: ['image', 'slice', 'crop', 'multi'] },
  { slug: 'image-to-base64', titleKey: 'tools.image-to-base64.name', descKey: 'tools.image-to-base64.desc', category: 'utility', icon: 'Binary', keywords: ['image', 'base64', 'convert', 'encode'] },
  { slug: 'text-case', titleKey: 'tools.text-case.name', descKey: 'tools.text-case.desc', category: 'text', icon: 'CaseSensitive', keywords: ['text', 'case', 'convert'] },
  { slug: 'html-entity', titleKey: 'tools.html-entity.name', descKey: 'tools.html-entity.desc', category: 'text', icon: 'Code', keywords: ['html', 'entity', 'encode', 'decode'] },
  { slug: 'css-gradient', titleKey: 'tools.css-gradient.name', descKey: 'tools.css-gradient.desc', category: 'dev', icon: 'Paintbrush', keywords: ['css', 'gradient', 'design'] },
  { slug: 'contrast-checker', titleKey: 'tools.contrast-checker.name', descKey: 'tools.contrast-checker.desc', category: 'dev', icon: 'Eye', keywords: ['color', 'contrast', 'wcag'] },
  { slug: 'api-tester', titleKey: 'tools.api-tester.name', descKey: 'tools.api-tester.desc', category: 'dev', icon: 'Send', keywords: ['api', 'http', 'request'] },
  { slug: 'sql-formatter', titleKey: 'tools.sql-formatter.name', descKey: 'tools.sql-formatter.desc', category: 'dev', icon: 'Database', keywords: ['sql', 'format', 'query'] },
  { slug: 'yaml-json', titleKey: 'tools.yaml-json.name', descKey: 'tools.yaml-json.desc', category: 'dev', icon: 'ArrowLeftRight', keywords: ['yaml', 'json', 'convert'] },
  { slug: 'css-grid', titleKey: 'tools.css-grid.name', descKey: 'tools.css-grid.desc', category: 'dev', icon: 'Grid3x3', keywords: ['css', 'grid', 'layout'] },
  { slug: 'box-shadow', titleKey: 'tools.box-shadow.name', descKey: 'tools.box-shadow.desc', category: 'dev', icon: 'Square', keywords: ['css', 'shadow', 'box'] },
  { slug: 'css-animation', titleKey: 'tools.css-animation.name', descKey: 'tools.css-animation.desc', category: 'dev', icon: 'Play', keywords: ['css', 'animation', 'keyframe'] },
  { slug: 'unicode-converter', titleKey: 'tools.unicode-converter.name', descKey: 'tools.unicode-converter.desc', category: 'text', icon: 'Hash', keywords: ['unicode', 'codepoint', 'convert'] },
  { slug: 'morse-code', titleKey: 'tools.morse-code.name', descKey: 'tools.morse-code.desc', category: 'text', icon: 'Radio', keywords: ['morse', 'code', 'encode'] },
  { slug: 'url-parser', titleKey: 'tools.url-parser.name', descKey: 'tools.url-parser.desc', category: 'dev', icon: 'Link', keywords: ['url', 'parse', 'component'] },
  { slug: 'json-schema', titleKey: 'tools.json-schema.name', descKey: 'tools.json-schema.desc', category: 'dev', icon: 'FileJson', keywords: ['json', 'schema', 'generate'] },
  { slug: 'regex-visual', titleKey: 'tools.regex-visual.name', descKey: 'tools.regex-visual.desc', category: 'dev', icon: 'Waypoints', keywords: ['regex', 'visual', 'explain'] },
  { slug: 'font-compare', titleKey: 'tools.font-compare.name', descKey: 'tools.font-compare.desc', category: 'utility', icon: 'Type', keywords: ['font', 'compare', 'text'] },
  { slug: 'base32-codec', titleKey: 'tools.base32-codec.name', descKey: 'tools.base32-codec.desc', category: 'text', icon: 'Binary', keywords: ['base32', 'encode', 'decode'] },
  { slug: 'jwt-generator', titleKey: 'tools.jwt-generator.name', descKey: 'tools.jwt-generator.desc', category: 'dev', icon: 'Key', keywords: ['jwt', 'token', 'generate'] },
  { slug: 'html-to-jsx', titleKey: 'tools.html-to-jsx.name', descKey: 'tools.html-to-jsx.desc', category: 'dev', icon: 'Code', keywords: ['html', 'jsx', 'react'] },
  { slug: 'css-to-tailwind', titleKey: 'tools.css-to-tailwind.name', descKey: 'tools.css-to-tailwind.desc', category: 'dev', icon: 'Wind', keywords: ['css', 'tailwind', 'convert'] },
  { slug: 'csv-to-json', titleKey: 'tools.csv-to-json.name', descKey: 'tools.csv-to-json.desc', category: 'utility', icon: 'FileText', keywords: ['csv', 'json', 'parse'] },
  { slug: 'json-to-csv', titleKey: 'tools.json-to-csv.name', descKey: 'tools.json-to-csv.desc', category: 'utility', icon: 'Table', keywords: ['json', 'csv', 'convert'] },
  { slug: 'xml-formatter', titleKey: 'tools.xml-formatter.name', descKey: 'tools.xml-formatter.desc', category: 'text', icon: 'FileCode', keywords: ['xml', 'format', 'beautify'] },
  { slug: 'protobuf-viewer', titleKey: 'tools.protobuf-viewer.name', descKey: 'tools.protobuf-viewer.desc', category: 'dev', icon: 'Box', keywords: ['protobuf', 'proto', 'viewer'] },
  { slug: 'password-strength', titleKey: 'tools.password-strength.name', descKey: 'tools.password-strength.desc', category: 'utility', icon: 'Shield', keywords: ['password', 'strength', 'check'] },
  { slug: 'docker-compose', titleKey: 'tools.docker-compose.name', descKey: 'tools.docker-compose.desc', category: 'dev', icon: 'Container', keywords: ['docker', 'compose', 'yaml'] },
  { slug: 'nginx-config', titleKey: 'tools.nginx-config.name', descKey: 'tools.nginx-config.desc', category: 'dev', icon: 'Server', keywords: ['nginx', 'config', 'proxy'] },
  { slug: 'git-commit', titleKey: 'tools.git-commit.name', descKey: 'tools.git-commit.desc', category: 'dev', icon: 'GitBranch', keywords: ['git', 'commit', 'message'] },
  { slug: 'json-prettier-enhanced', titleKey: 'tools.json-prettier-enhanced.name', descKey: 'tools.json-prettier-enhanced.desc', category: 'text', icon: 'Braces', keywords: ['json', 'json5', 'format'] },
  { slug: 'ip-lookup', titleKey: 'tools.ip-lookup.name', descKey: 'tools.ip-lookup.desc', category: 'utility', icon: 'Globe', keywords: ['ip', 'address', 'browser'] },
  { slug: 'clipboard-history', titleKey: 'tools.clipboard-history.name', descKey: 'tools.clipboard-history.desc', category: 'utility', icon: 'ClipboardList', keywords: ['clipboard', 'copy', 'history'] },
  { slug: 'base64-to-image', titleKey: 'tools.base64-to-image.name', descKey: 'tools.base64-to-image.desc', category: 'image', icon: 'Image', keywords: ['base64', 'image', 'decode'] },
  { slug: 'json-to-env', titleKey: 'tools.json-to-env.name', descKey: 'tools.json-to-env.desc', category: 'dev', icon: 'FileCode', keywords: ['json', 'env', 'convert'] },
  { slug: 'code-minifier', titleKey: 'tools.code-minifier.name', descKey: 'tools.code-minifier.desc', category: 'dev', icon: 'Minimize2', keywords: ['code', 'minify', 'format'] },
  { slug: 'color-palette', titleKey: 'tools.color-palette.name', descKey: 'tools.color-palette.desc', category: 'dev', icon: 'Palette', keywords: ['color', 'palette', 'scheme'] },
  { slug: 'emoji-picker', titleKey: 'tools.emoji-picker.name', descKey: 'tools.emoji-picker.desc', category: 'utility', icon: 'Smile', keywords: ['emoji', 'copy', 'symbol'] },
  { slug: 'markdown-to-html', titleKey: 'tools.markdown-to-html.name', descKey: 'tools.markdown-to-html.desc', category: 'text', icon: 'FileText', keywords: ['markdown', 'html', 'convert'] },
  { slug: 'placeholder-image', titleKey: 'tools.placeholder-image.name', descKey: 'tools.placeholder-image.desc', category: 'utility', icon: 'Image', keywords: ['placeholder', 'image', 'generate'] },
  { slug: 'markdown-table', titleKey: 'tools.markdown-table.name', descKey: 'tools.markdown-table.desc', category: 'text', icon: 'Table', keywords: ['markdown', 'table', 'generate'] },
  { slug: 'qr-reader', titleKey: 'tools.qr-reader.name', descKey: 'tools.qr-reader.desc', category: 'utility', icon: 'ScanLine', keywords: ['qr', 'code', 'read', 'scan'] },
  { slug: 'hash-generator', titleKey: 'tools.hash-generator.name', descKey: 'tools.hash-generator.desc', category: 'dev', icon: 'Hash', keywords: ['hash', 'md5', 'sha'] },
  { slug: 'jwt-decoder', titleKey: 'tools.jwt-decoder.name', descKey: 'tools.jwt-decoder.desc', category: 'dev', icon: 'Key', keywords: ['jwt', 'token', 'decode'] },
  { slug: 'color-converter', titleKey: 'tools.color-converter.name', descKey: 'tools.color-converter.desc', category: 'dev', icon: 'Palette', keywords: ['color', 'hex', 'rgb', 'hsl'] },
  { slug: 'css-unit-converter', titleKey: 'tools.css-unit-converter.name', descKey: 'tools.css-unit-converter.desc', category: 'dev', icon: 'Ruler', keywords: ['css', 'unit', 'px', 'rem'] },
  { slug: 'password-generator', titleKey: 'tools.password-generator.name', descKey: 'tools.password-generator.desc', category: 'dev', icon: 'Lock', keywords: ['password', 'generate', 'random'] },
  { slug: 'cron-parser', titleKey: 'tools.cron-parser.name', descKey: 'tools.cron-parser.desc', category: 'dev', icon: 'Clock', keywords: ['cron', 'schedule', 'parse'] },
  { slug: 'json-to-ts', titleKey: 'tools.json-to-ts.name', descKey: 'tools.json-to-ts.desc', category: 'dev', icon: 'FileCode', keywords: ['json', 'typescript', 'interface'] },
  { slug: 'svg-viewer', titleKey: 'tools.svg-viewer.name', descKey: 'tools.svg-viewer.desc', category: 'dev', icon: 'Image', keywords: ['svg', 'preview', 'editor'] },
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
