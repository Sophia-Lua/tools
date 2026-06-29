import { useState, useCallback } from 'react'

const HTML_ATTR_MAP: Record<string, string> = {
  class: 'className',
  for: 'htmlFor',
  tabindex: 'tabIndex',
  readonly: 'readOnly',
  maxlength: 'maxLength',
  cellpadding: 'cellPadding',
  cellspacing: 'cellSpacing',
  rowspan: 'rowSpan',
  colspan: 'colSpan',
  crossorigin: 'crossOrigin',
  accesskey: 'accessKey',
  contenteditable: 'contentEditable',
  frameborder: 'frameBorder',
  enctype: 'encType',
  nonce: 'nonce',
  spellcheck: 'spellCheck',
  autocomplete: 'autoComplete',
  autofocus: 'autoFocus',
  formaction: 'formAction',
  formenctype: 'formEncType',
  formmethod: 'formMethod',
  formnovalidate: 'formNoValidate',
  formtarget: 'formTarget',
  nomodule: 'noModule',
  novalidate: 'noValidate',
  playsinline: 'playsInline',
  allowfullscreen: 'allowFullScreen',
}

const SELF_CLOSING_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
])

const STYLE_CAMEL: Record<string, string> = {
  'background-color': 'backgroundColor',
  'background-image': 'backgroundImage',
  'border-color': 'borderColor',
  'border-radius': 'borderRadius',
  'border-width': 'borderWidth',
  'border-style': 'borderStyle',
  'border-top': 'borderTop',
  'border-bottom': 'borderBottom',
  'border-left': 'borderLeft',
  'border-right': 'borderRight',
  'font-size': 'fontSize',
  'font-family': 'fontFamily',
  'font-weight': 'fontWeight',
  'font-style': 'fontStyle',
  'line-height': 'lineHeight',
  'text-align': 'textAlign',
  'text-decoration': 'textDecoration',
  'text-indent': 'textIndent',
  'text-transform': 'textTransform',
  'text-shadow': 'textShadow',
  'letter-spacing': 'letterSpacing',
  'word-spacing': 'wordSpacing',
  'white-space': 'whiteSpace',
  'vertical-align': 'verticalAlign',
  'overflow-wrap': 'overflowWrap',
  'margin-top': 'marginTop',
  'margin-right': 'marginRight',
  'margin-bottom': 'marginBottom',
  'margin-left': 'marginLeft',
  'padding-top': 'paddingTop',
  'padding-right': 'paddingRight',
  'padding-bottom': 'paddingBottom',
  'padding-left': 'paddingLeft',
  'grid-column': 'gridColumn',
  'grid-row': 'gridRow',
  'grid-template-columns': 'gridTemplateColumns',
  'grid-template-rows': 'gridTemplateRows',
  'max-width': 'maxWidth',
  'max-height': 'maxHeight',
  'min-width': 'minWidth',
  'min-height': 'minHeight',
  'box-shadow': 'boxShadow',
  'z-index': 'zIndex',
  'clip-path': 'clipPath',
  'flex-basis': 'flexBasis',
  'flex-grow': 'flexGrow',
  'flex-shrink': 'flexShrink',
  'flex-direction': 'flexDirection',
  'justify-content': 'justifyContent',
  'align-items': 'alignItems',
  'align-self': 'alignSelf',
  'gap': 'gap',
  'row-gap': 'rowGap',
  'column-gap': 'columnGap',
}

function toCamelCase(prop: string): string {
  if (STYLE_CAMEL[prop]) return STYLE_CAMEL[prop]
  return prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
}

function transformStyleValue(val: string): string {
  const props = val.split(';').filter(Boolean).map((p) => p.trim())
  const mapped = props.map((p) => {
    const colonIdx = p.indexOf(':')
    if (colonIdx === -1) return p
    const prop = p.slice(0, colonIdx).trim()
    const value = p.slice(colonIdx + 1).trim()
    return `${toCamelCase(prop)}: '${value.replace(/'/g, "\\'")}'`
  })
  return `{{ ${mapped.join(', ')} }}`
}

function transformHtmlToJsx(html: string): string {
  let result = html

  result = result.replace(/style="([^"]*)"/g, (_, val) => {
    return `style={${transformStyleValue(val)}}`
  })

  result = result.replace(/\bclass="([^"]*)"/g, (_, val) => `className="${val}"`)
  result = result.replace(/\bclass='([^']*)'/g, (_, val) => `className='${val}'`)
  result = result.replace(/\bfor="([^"]*)"/g, (_, val) => `htmlFor="${val}"`)
  result = result.replace(/\bfor='([^']*)'/g, (_, val) => `htmlFor='${val}'`)

  for (const [attr, jsx] of Object.entries(HTML_ATTR_MAP)) {
    const regex = new RegExp(`\\b${attr}=`, 'g')
    result = result.replace(regex, `${jsx}=`)
  }

  result = result.replace(/aria-([a-z]+)/g, (_, name) => {
    return `aria-${name.charAt(0).toUpperCase()}${name.slice(1)}`
  })

  result = result.replace(/<([a-zA-Z][a-zA-Z0-9]*)\s*(\/?)>/g, (match, tag, slash) => {
    if (SELF_CLOSING_TAGS.has(tag.toLowerCase())) {
      return `<${tag} />`
    }
    return match
  })

  result = result.replace(/<([a-zA-Z][a-zA-Z0-9]*)\s+([^>]*[^/])>/g, (match, tag, attrs) => {
    if (SELF_CLOSING_TAGS.has(tag.toLowerCase()) && !match.includes('/>')) {
      return `<${tag} ${attrs.trim()} />`
    }
    return match
  })

  return result
}

export default function HtmlToJsx() {
  const [input, setInput] = useState('<div class="container">\n  <h1>Hello World</h1>\n  <p style="color: red; font-size: 16px;">This is a paragraph.</p>\n  <img src="photo.jpg" />\n  <input type="text" maxlength="100" readonly />\n  <label for="email">Email</label>\n  <div aria-hidden="true">Hidden content</div>\n</div>')
  const [output, setOutput] = useState('')
  const [copied, setCopied] = useState(false)

  const handleChange = useCallback((val: string) => {
    setInput(val)
    try {
      setOutput(transformHtmlToJsx(val))
    } catch {
      setOutput('')
    }
  }, [])

  const copyToClipboard = useCallback(() => {
    if (output) {
      navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }, [output])

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium mb-1 text-[var(--color-text)]">HTML Input</label>
        <textarea
          className="w-full h-48 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 font-mono text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-y"
          placeholder="Paste HTML here..."
          value={input}
          onChange={(e) => handleChange(e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        {output && (
          <button onClick={copyToClipboard} className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-colors">
            {copied ? 'Copied!' : 'Copy JSX'}
          </button>
        )}
      </div>

      {output && (
        <div>
          <label className="block text-sm font-medium mb-1 text-[var(--color-text)]">JSX Output</label>
          <textarea
            className="w-full h-48 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3 font-mono text-sm text-[var(--color-text)] resize-y"
            readOnly
            value={output}
          />
        </div>
      )}
    </div>
  )
}
