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
  { slug: 'image-to-base64', titleZh: '图片转Base64', titleEn: 'Image to Base64', descZh: '将图片转换为Base64编码字符串', descEn: 'Convert images to Base64 encoded strings', category: 'image', icon: 'Binary' },
  { slug: 'hash-generator', titleZh: '哈希生成器', titleEn: 'Hash Generator', descZh: '生成MD5、SHA-1、SHA-256等哈希值', descEn: 'Generate MD5, SHA-1, SHA-256 hashes', category: 'dev', icon: 'Hash' },
  { slug: 'jwt-decoder', titleZh: 'JWT解码器', titleEn: 'JWT Decoder', descZh: '解码和验证JWT令牌', descEn: 'Decode and verify JWT tokens', category: 'dev', icon: 'Key' },
  { slug: 'color-converter', titleZh: '颜色转换', titleEn: 'Color Converter', descZh: '在HEX、RGB、HSL之间转换颜色', descEn: 'Convert between HEX, RGB, HSL colors', category: 'dev', icon: 'Palette' },
  { slug: 'css-unit-converter', titleZh: 'CSS单位转换', titleEn: 'CSS Unit Converter', descZh: '转换CSS单位(px, rem, em等)', descEn: 'Convert CSS units (px, rem, em, etc.)', category: 'dev', icon: 'Ruler' },
  { slug: 'password-generator', titleZh: '密码生成器', titleEn: 'Password Generator', descZh: '生成安全随机密码', descEn: 'Generate secure random passwords', category: 'dev', icon: 'Lock' },
  { slug: 'cron-parser', titleZh: 'Cron表达式解析', titleEn: 'Cron Parser', descZh: '解析cron表达式并显示执行时间', descEn: 'Parse cron expressions and show execution times', category: 'dev', icon: 'Clock' },
  { slug: 'json-to-ts', titleZh: 'JSON转TypeScript', titleEn: 'JSON to TypeScript', descZh: '从JSON数据生成TypeScript类型定义', descEn: 'Generate TypeScript types from JSON data', category: 'dev', icon: 'FileCode' },
  { slug: 'svg-viewer', titleZh: 'SVG预览器', titleEn: 'SVG Viewer', descZh: '实时编辑和预览SVG代码', descEn: 'Edit and preview SVG code in real-time', category: 'dev', icon: 'Image' },
  { slug: 'text-case', titleZh: '文本大小写转换', titleEn: 'Text Case Converter', descZh: '在多种大小写格式之间转换文本', descEn: 'Convert text between different case formats', category: 'text', icon: 'CaseSensitive' },
  { slug: 'html-entity', titleZh: 'HTML实体编解码', titleEn: 'HTML Entity Encoder', descZh: '编码和解码HTML实体字符', descEn: 'Encode and decode HTML entity characters', category: 'text', icon: 'Code' },
  { slug: 'css-gradient', titleZh: 'CSS渐变生成器', titleEn: 'CSS Gradient Generator', descZh: '可视化配置CSS渐变', descEn: 'Visually configure CSS gradients', category: 'dev', icon: 'Paintbrush' },
  { slug: 'contrast-checker', titleZh: '颜色对比度检查', titleEn: 'Contrast Checker', descZh: '检测WCAG颜色对比度', descEn: 'Check WCAG color contrast', category: 'dev', icon: 'Eye' },
  { slug: 'api-tester', titleZh: 'API请求测试器', titleEn: 'API Tester', descZh: '发送HTTP请求并查看响应', descEn: 'Send HTTP requests and view responses', category: 'dev', icon: 'Send' },
  { slug: 'sql-formatter', titleZh: 'SQL格式化', titleEn: 'SQL Formatter', descZh: '美化和压缩SQL查询', descEn: 'Beautify and minify SQL queries', category: 'dev', icon: 'Database' },
  { slug: 'yaml-json', titleZh: 'YAML与JSON互转', titleEn: 'YAML ↔ JSON', descZh: '在YAML和JSON之间转换', descEn: 'Convert between YAML and JSON', category: 'dev', icon: 'ArrowLeftRight' },
  { slug: 'css-grid', titleZh: 'CSS Grid生成器', titleEn: 'CSS Grid Generator', descZh: '可视化配置Grid布局', descEn: 'Visually configure CSS Grid layouts', category: 'dev', icon: 'Grid3x3' },
  { slug: 'box-shadow', titleZh: '阴影生成器', titleEn: 'Box Shadow Generator', descZh: '可视化配置box-shadow', descEn: 'Visually configure CSS box-shadow', category: 'dev', icon: 'Square' },
  { slug: 'css-animation', titleZh: 'CSS动画生成器', titleEn: 'CSS Animation', descZh: '可视化配置CSS动画', descEn: 'Visually configure CSS animations', category: 'dev', icon: 'Play' },
  { slug: 'unicode-converter', titleZh: 'Unicode转换', titleEn: 'Unicode Converter', descZh: '文本与Unicode码点互转', descEn: 'Convert text to/from Unicode', category: 'text', icon: 'Hash' },
  { slug: 'morse-code', titleZh: '摩尔斯电码', titleEn: 'Morse Code', descZh: '文本与摩尔斯电码互转', descEn: 'Convert text to/from Morse code', category: 'text', icon: 'Radio' },
  { slug: 'url-parser', titleZh: 'URL解析器', titleEn: 'URL Parser', descZh: '解析和编辑URL各部分', descEn: 'Parse and edit URL components', category: 'dev', icon: 'Link' },
  { slug: 'json-schema', titleZh: 'JSON Schema生成器', titleEn: 'JSON Schema Gen', descZh: '从JSON生成Schema', descEn: 'Generate JSON Schema from JSON', category: 'dev', icon: 'FileJson' },
  { slug: 'regex-visual', titleZh: '正则表达式可视化', titleEn: 'Regex Visualizer', descZh: '图形化展示正则匹配', descEn: 'Visualize regex matching flow', category: 'dev', icon: 'Waypoints' },
  { slug: 'font-compare', titleZh: '字体对比', titleEn: 'Font Comparator', descZh: '并排对比不同字体', descEn: 'Compare different fonts side by side', category: 'utility', icon: 'Type' },
  { slug: 'base32-codec', titleZh: 'Base32编解码', titleEn: 'Base32 Codec', descZh: 'RFC 4648 Base32编码解码', descEn: 'RFC 4648 Base32 encode/decode', category: 'text', icon: 'Binary' },
  { slug: 'jwt-generator', titleZh: 'JWT生成器', titleEn: 'JWT Generator', descZh: '生成JWT令牌', descEn: 'Generate JWT tokens', category: 'dev', icon: 'Key' },
  { slug: 'html-to-jsx', titleZh: 'HTML转JSX', titleEn: 'HTML to JSX', descZh: 'HTML转换为React JSX', descEn: 'Convert HTML to React JSX', category: 'dev', icon: 'Code' },
  { slug: 'css-to-tailwind', titleZh: 'CSS转Tailwind', titleEn: 'CSS to Tailwind', descZh: 'CSS转换为Tailwind类名', descEn: 'Convert CSS to Tailwind classes', category: 'dev', icon: 'Wind' },
  { slug: 'csv-to-json', titleZh: 'CSV转JSON', titleEn: 'CSV to JSON', descZh: 'CSV解析为JSON', descEn: 'Parse CSV to JSON', category: 'utility', icon: 'FileText' },
  { slug: 'json-to-csv', titleZh: 'JSON转CSV', titleEn: 'JSON to CSV', descZh: 'JSON数组转CSV', descEn: 'Convert JSON to CSV', category: 'utility', icon: 'Table' },
  { slug: 'xml-formatter', titleZh: 'XML格式化', titleEn: 'XML Formatter', descZh: '格式化XML代码', descEn: 'Format XML code', category: 'text', icon: 'FileCode' },
  { slug: 'protobuf-viewer', titleZh: 'Protobuf查看器', titleEn: 'Protobuf Viewer', descZh: '查看Protobuf定义', descEn: 'View Protobuf definitions', category: 'dev', icon: 'Box' },
  { slug: 'password-strength', titleZh: '密码强度检测', titleEn: 'Password Strength', descZh: '检测密码强度', descEn: 'Check password strength', category: 'utility', icon: 'Shield' },
  { slug: 'docker-compose', titleZh: 'Docker Compose生成器', titleEn: 'Docker Compose Gen', descZh: '生成docker-compose配置', descEn: 'Generate docker-compose config', category: 'dev', icon: 'Container' },
  { slug: 'nginx-config', titleZh: 'Nginx配置生成器', titleEn: 'Nginx Config Gen', descZh: '生成Nginx配置', descEn: 'Generate Nginx config', category: 'dev', icon: 'Server' },
  { slug: 'git-commit', titleZh: 'Git Commit生成器', titleEn: 'Git Commit Gen', descZh: '生成规范commit message', descEn: 'Generate commit messages', category: 'dev', icon: 'GitBranch' },
  { slug: 'json-prettier-enhanced', titleZh: 'JSON美化增强', titleEn: 'JSON Prettier+', descZh: '格式化JSON/JSON5/JSONC', descEn: 'Format JSON/JSON5/JSONC', category: 'text', icon: 'Braces' },
  { slug: 'ip-lookup', titleZh: 'IP地址查询', titleEn: 'IP Lookup', descZh: '显示本机IP和浏览器信息', descEn: 'Show local IP and browser info', category: 'utility', icon: 'Globe' },
  { slug: 'clipboard-history', titleZh: '剪贴板历史', titleEn: 'Clipboard History', descZh: '记录最近复制的内容', descEn: 'Track recent copied content', category: 'utility', icon: 'ClipboardList' },
  { slug: 'base64-to-image', titleZh: 'Base64转图片', titleEn: 'Base64 to Image', descZh: 'Base64字符串转图片下载', descEn: 'Convert Base64 to image', category: 'image', icon: 'Image' },
  { slug: 'json-to-env', titleZh: 'JSON转环境变量', titleEn: 'JSON to .env', descZh: 'JSON转换为.env格式', descEn: 'Convert JSON to .env', category: 'dev', icon: 'FileCode' },
  { slug: 'code-minifier', titleZh: '代码压缩器', titleEn: 'Code Minifier', descZh: '格式化和压缩代码', descEn: 'Format and minify code', category: 'dev', icon: 'Minimize2' },
  { slug: 'color-palette', titleZh: '调色板生成器', titleEn: 'Color Palette', descZh: '从主色生成配色方案', descEn: 'Generate color schemes', category: 'dev', icon: 'Palette' },
  { slug: 'emoji-picker', titleZh: 'Emoji搜索器', titleEn: 'Emoji Picker', descZh: '搜索和复制Emoji', descEn: 'Search and copy Emoji', category: 'utility', icon: 'Smile' },
  { slug: 'markdown-to-html', titleZh: 'Markdown转HTML', titleEn: 'Markdown to HTML', descZh: 'Markdown转换为HTML', descEn: 'Convert Markdown to HTML', category: 'text', icon: 'FileText' },
  { slug: 'placeholder-image', titleZh: '占位图片生成', titleEn: 'Placeholder Image', descZh: '生成占位图片', descEn: 'Generate placeholder images', category: 'utility', icon: 'Image' },
  { slug: 'markdown-table', titleZh: 'Markdown表格生成器', titleEn: 'MD Table Gen', descZh: '生成Markdown表格', descEn: 'Generate Markdown tables', category: 'text', icon: 'Table' },
  { slug: 'qr-reader', titleZh: '二维码识别器', titleEn: 'QR Code Reader', descZh: '上传图片识别二维码', descEn: 'Read QR codes from images', category: 'utility', icon: 'ScanLine' },
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
  CaseSensitive: <><path d="M3 5h1"/><path d="M3 12h1"/><path d="M3 19h1"/><path d="M11 5h10"/><path d="M11 12h6"/><path d="M11 19h10"/></>,
  Code: <><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></>,
  FileImage: <><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></>,
  Paintbrush: <><path d="m14.622 17.897-10.68-2.913"/><path d="M18.376 2.622a1 1 0 1 1 3.002 3.002L17.36 9.643a.5.5 0 0 0 0 .707l.944.944a2.41 2.41 0 0 1 0 3.408l-.944.944a.5.5 0 0 1-.707 0L8.354 7.348a.5.5 0 0 1 0-.707l.944-.944a2.41 2.41 0 0 1 3.408 0l.944.944a.5.5 0 0 0 .707 0z"/><path d="M9 3c.533.533 1.214 1.5 2 2.5 1.453 1.997.768 5.5-1.5 8.5s-5.9 3.5-8.5 1.5"/></>,
  Eye: <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></>,
  Send: <><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>,
  Database: <><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></>,
  ArrowLeftRight: <><polyline points="8 3 4 7 8 11"/><line x1="4" y1="7" x2="20" y2="7"/><polyline points="16 21 20 17 16 13"/><line x1="20" y1="17" x2="4" y2="17"/></>,
  Grid3x3: <><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></>,
  Square: <><rect width="18" height="18" x="3" y="3" rx="2"/></>,
  Play: <><polygon points="5 3 19 12 5 21 5 3"/></>,
  Radio: <><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/></>,
  FileJson: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M10 12a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1 1 1 0 0 1 1 1v1a1 1 0 0 0 1 1"/><path d="M14 18a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1 1 1 0 0 1-1-1v-1a1 1 0 0 0-1-1"/></>,
  Waypoints: <><circle cx="12" cy="4.5" r="2.5"/><circle cx="5" cy="19" r="2.5"/><circle cx="19" cy="19" r="2.5"/><path d="m8 21 4-10 4 10"/><path d="M12 7.5V4"/></>,
  Type: <><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></>,
  Wind: <><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/></>,
  Box: <><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></>,
  Shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></>,
  Container: <><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></>,
  Server: <><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></>,
  GitBranch: <><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></>,
  Globe: <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>,
  ClipboardList: <><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></>,
  Smile: <><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></>,
  ScanLine: <><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></>,
  Lock: <><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
  Clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
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
