import { useState } from 'react'

const categories = [
  { id: 'text', labelZh: '文本处理', labelEn: 'Text Processing' },
  { id: 'image', labelZh: '图片处理', labelEn: 'Image Processing' },
  { id: 'dev', labelZh: '开发者工具', labelEn: 'Developer Tools' },
  { id: 'file', labelZh: '文件转换', labelEn: 'File Conversion' },
  { id: 'utility', labelZh: '综合工具', labelEn: 'Utilities' },
]

const tools = [
  { slug: 'json-formatter', titleZh: 'JSON格式化', titleEn: 'JSON Formatter', descZh: '格式化、压缩和验证JSON数据', descEn: 'Format, compress and validate JSON data', category: 'text', icon: 'Braces' },
  { slug: 'base64-codec', titleZh: 'Base64编解码', titleEn: 'Base64 Codec', descZh: 'Base64编码和解码文本', descEn: 'Encode and decode Base64 text', category: 'text', icon: 'Binary' },
  { slug: 'url-codec', titleZh: 'URL编解码', titleEn: 'URL Codec', descZh: 'URL编码和解码', descEn: 'Encode and decode URLs', category: 'text', icon: 'Link' },
  { slug: 'markdown-preview', titleZh: 'Markdown预览', titleEn: 'Markdown Preview', descZh: '实时预览Markdown文档', descEn: 'Preview Markdown documents in real-time', category: 'text', icon: 'FileText' },
  { slug: 'regex-tester', titleZh: '正则表达式测试', titleEn: 'Regex Tester', descZh: '测试和调试正则表达式', descEn: 'Test and debug regular expressions', category: 'text', icon: 'Regex' },
  { slug: 'yaml-formatter', titleZh: 'YAML格式化', titleEn: 'YAML Formatter', descZh: '格式化和验证YAML数据', descEn: 'Format and validate YAML data', category: 'text', icon: 'FileCode' },
  { slug: 'text-diff', titleZh: '文本差异对比', titleEn: 'Text Diff', descZh: '对比两段文本的差异', descEn: 'Compare differences between two texts', category: 'text', icon: 'GitCompare' },
  { slug: 'image-compressor', titleZh: '图片压缩', titleEn: 'Image Compressor', descZh: '压缩图片文件大小', descEn: 'Compress image file size', category: 'image', icon: 'Minimize2' },
  { slug: 'image-converter', titleZh: '图片格式转换', titleEn: 'Image Converter', descZh: '转换图片格式', descEn: 'Convert image formats', category: 'image', icon: 'RefreshCw' },
  { slug: 'image-cropper', titleZh: '图片裁剪', titleEn: 'Image Cropper', descZh: '裁剪和调整图片尺寸', descEn: 'Crop and resize images', category: 'image', icon: 'Crop' },
  { slug: 'image-metadata', titleZh: '图片元数据', titleEn: 'Image Metadata', descZh: '查看和剥离图片元数据', descEn: 'View and strip image metadata', category: 'image', icon: 'Info' },
  { slug: 'image-slicer', titleZh: '多区域切图', titleEn: 'Multi-Region Slicer', descZh: '框选多个区域导出为独立图片', descEn: 'Select multiple regions and export as separate images', category: 'image', icon: 'Scissors' },
  { slug: 'hash-generator', titleZh: '哈希生成器', titleEn: 'Hash Generator', descZh: '生成MD5、SHA-1、SHA-256等哈希值', descEn: 'Generate MD5, SHA-1, SHA-256 hashes', category: 'dev', icon: 'Hash' },
  { slug: 'jwt-decoder', titleZh: 'JWT解码器', titleEn: 'JWT Decoder', descZh: '解码和验证JWT令牌', descEn: 'Decode and verify JWT tokens', category: 'dev', icon: 'Key' },
  { slug: 'color-converter', titleZh: '颜色转换', titleEn: 'Color Converter', descZh: '在HEX、RGB、HSL之间转换颜色', descEn: 'Convert between HEX, RGB, HSL colors', category: 'dev', icon: 'Palette' },
  { slug: 'css-unit-converter', titleZh: 'CSS单位转换', titleEn: 'CSS Unit Converter', descZh: '转换CSS单位(px, rem, em等)', descEn: 'Convert CSS units (px, rem, em, etc.)', category: 'dev', icon: 'Ruler' },
  { slug: 'password-generator', titleZh: '密码生成器', titleEn: 'Password Generator', descZh: '生成安全随机密码', descEn: 'Generate secure random passwords', category: 'dev', icon: 'Lock' },
  { slug: 'pdf-merger', titleZh: 'PDF合并', titleEn: 'PDF Merger', descZh: '合并多个PDF文件', descEn: 'Merge multiple PDF files', category: 'file', icon: 'Merge' },
  { slug: 'pdf-splitter', titleZh: 'PDF拆分', titleEn: 'PDF Splitter', descZh: '拆分PDF文件', descEn: 'Split PDF files', category: 'file', icon: 'Scissors' },
  { slug: 'docx-converter', titleZh: 'Word转HTML', titleEn: 'Word to HTML', descZh: '将Word文档转换为HTML', descEn: 'Convert Word documents to HTML', category: 'file', icon: 'FileText' },
  { slug: 'xlsx-converter', titleZh: 'Excel转CSV', titleEn: 'Excel to CSV', descZh: '将Excel文件转换为CSV/JSON', descEn: 'Convert Excel files to CSV/JSON', category: 'file', icon: 'Table' },
  { slug: 'csv-viewer', titleZh: 'CSV查看器', titleEn: 'CSV Viewer', descZh: '查看和编辑CSV文件', descEn: 'View and edit CSV files', category: 'file', icon: 'Table' },
  { slug: 'zip-viewer', titleZh: '压缩文件查看', titleEn: 'Archive Viewer', descZh: '查看ZIP/GZIP压缩文件内容', descEn: 'View ZIP/GZIP archive contents', category: 'file', icon: 'Archive' },
  { slug: 'qr-generator', titleZh: '二维码生成', titleEn: 'QR Generator', descZh: '生成各种格式的二维码', descEn: 'Generate QR codes in various formats', category: 'utility', icon: 'QrCode' },
  { slug: 'datetime-tool', titleZh: '日期时间工具', titleEn: 'Date/Time Tool', descZh: '日期格式化、时间戳转换', descEn: 'Format dates, convert timestamps', category: 'utility', icon: 'Calendar' },
  { slug: 'text-stats', titleZh: '文本统计', titleEn: 'Text Statistics', descZh: '统计文本字数、行数等信息', descEn: 'Count words, characters and more', category: 'utility', icon: 'BarChart3' },
  { slug: 'number-converter', titleZh: '进制转换', titleEn: 'Number Base Converter', descZh: '在不同进制之间转换数字', descEn: 'Convert numbers between bases', category: 'utility', icon: 'Hash' },
  { slug: 'uuid-generator', titleZh: 'UUID生成器', titleEn: 'UUID Generator', descZh: '生成UUID v4', descEn: 'Generate UUID v4', category: 'utility', icon: 'Fingerprint' },
  { slug: 'lorem-generator', titleZh: '占位文本生成', titleEn: 'Lorem Ipsum Generator', descZh: '生成Lorem Ipsum占位文本', descEn: 'Generate Lorem Ipsum placeholder text', category: 'utility', icon: 'AlignLeft' },
]

const iconPaths: Record<string, JSX.Element> = {
  Braces: <><path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/></>,
  Binary: <><rect x="14" y="14" width="4" height="6" rx="2"/><rect x="6" y="4" width="4" height="6" rx="2"/><path d="M6 20h4"/><path d="M14 10h4"/></>,
  Link: <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></>,
  FileText: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></>,
  Regex: <><circle cx="7" cy="17" r="3"/><circle cx="17" cy="17" r="3"/><path d="M7 8v6"/><path d="M17 8v6"/><path d="M7 8c4 0 6 4 10 4"/></>,
  FileCode: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="m10 13-2 2 2 2"/><path d="m14 17 2-2-2-2"/></>,
  GitCompare: <><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><path d="M11 18H8a2 2 0 0 1-2-2V9"/></>,
  Minimize2: <><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></>,
  RefreshCw: <><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></>,
  Crop: <><path d="M6.13 1L6 16a2 2 0 0 0 2 2h15"/><path d="M1 6.13L16 6a2 2 0 0 1 2 2v15"/></>,
  Info: <><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></>,
  Hash: <><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></>,
  Key: <><path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/></>,
  Palette: <><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></>,
  Ruler: <><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/></>,
  Lock: <><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
  Merge: <><path d="M8 19H5c-1 0-2-1-2-2V7c0-1 1-2 2-2h3"/><path d="M16 5h3c1 0 2 1 2 2v10c0 1-1 2-2 2h-3"/><line x1="12" y1="4" x2="12" y2="20"/></>,
  Scissors: <><circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/></>,
  Table: <><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></>,
  Archive: <><polyline points="21 8 21 21 3 21 3 8"/><rect width="21" height="5" x="1" y="3"/><line x1="10" y1="12" x2="14" y2="12"/></>,
  QrCode: <><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/></>,
  Calendar: <><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
  BarChart3: <><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></>,
  Fingerprint: <><path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4"/><path d="M5 19.5C5.5 18 6 15 6 12c0-.7.12-1.37.34-2"/><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/><path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/><path d="M8.65 22c.21-.66.45-1.32.57-2"/><path d="M14 13.12c0 2.38 0 6.38-1 8.88"/><path d="M2 16h.01"/><path d="M21.8 16c.2-2 .131-5.354 0-6"/><path d="M9 6.8a6 6 0 0 1 9 5.2c0 .47 0 1.17-.02 2"/></>,
  AlignLeft: <><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></>,
}

const catIconPaths: Record<string, JSX.Element> = {
  text: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>,
  image: <><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></>,
  dev: <><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></>,
  file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/></>,
  utility: <><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></>,
}

interface Props {
  lang: string
}

export default function ToolsGrid({ lang }: Props) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const isZh = lang === 'zh'
  const filteredTools = activeCategory
    ? tools.filter(t => t.category === activeCategory)
    : tools

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <aside className="w-full shrink-0 lg:w-40">
        <nav className="flex flex-row gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
          <button
            onClick={() => setActiveCategory(null)}
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors text-left ${
              !activeCategory
                ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text)]'
            }`}
          >
            {isZh ? '全部' : 'All'}
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors text-left ${
                activeCategory === cat.id
                  ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text)]'
              }`}
            >
              {isZh ? cat.labelZh : cat.labelEn}
            </button>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 [grid-auto-rows:1fr]" style={{ width: "100%" }}>
          {filteredTools.map(tool => (
            <a
              key={tool.slug}
              href={`/${lang}/tools/${tool.slug}`}
              className="group flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-all hover:border-[var(--color-primary)] hover:shadow-md"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-bg-secondary)] text-[var(--color-primary)] group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {iconPaths[tool.icon]}
                </svg>
              </div>
              <h3 className="mb-1 text-sm font-semibold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
                {isZh ? tool.titleZh : tool.titleEn}
              </h3>
              <p className="mt-auto text-xs leading-relaxed text-[var(--color-text-secondary)]">
                {isZh ? tool.descZh : tool.descEn}
              </p>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
