import { useState, useCallback } from 'react'

const SPACING_MAP: Record<string, string> = {
  '0': '0',
  '1px': 'px',
  '2px': '0.5',
  '3px': 'px',
  '4px': '1',
  '5px': '1.5',
  '6px': '2',
  '8px': '3',
  '10px': '3.5',
  '12px': '4',
  '14px': '5',
  '16px': '6',
  '20px': '8',
  '24px': '10',
  '28px': '12',
  '32px': '14',
  '36px': '16',
  '40px': '18',
  '48px': '20',
  '60px': '24',
  '64px': '26',
  '72px': '28',
  '80px': '32',
  '96px': '36',
  '0.25rem': 'px',
  '0.5rem': '1',
  '0.75rem': '1.5',
  '1rem': '4',
  '1.25rem': '5',
  '1.5rem': '6',
  '2rem': '8',
  '2.5rem': '10',
  '3rem': '12',
  '3.5rem': '14',
  '4rem': '16',
  '5rem': '20',
  '6rem': '24',
  '8rem': '32',
  '10rem': '40',
}

const FONT_SIZE_MAP: Record<string, string> = {
  '12px': 'text-xs',
  '14px': 'text-sm',
  '16px': 'text-base',
  '18px': 'text-lg',
  '20px': 'text-xl',
  '24px': 'text-2xl',
  '30px': 'text-3xl',
  '36px': 'text-4xl',
  '48px': 'text-5xl',
  '0.75rem': 'text-xs',
  '0.875rem': 'text-sm',
  '1rem': 'text-base',
  '1.125rem': 'text-lg',
  '1.25rem': 'text-xl',
  '1.5rem': 'text-2xl',
  '1.875rem': 'text-3xl',
  '2.25rem': 'text-4xl',
  '3rem': 'text-5xl',
}

const FONT_WEIGHT_MAP: Record<string, string> = {
  '100': 'font-thin',
  '200': 'font-extralight',
  '300': 'font-light',
  '400': 'font-normal',
  '500': 'font-medium',
  '600': 'font-semibold',
  '700': 'font-bold',
  '800': 'font-extrabold',
  '900': 'font-black',
  'normal': 'font-normal',
  'bold': 'font-bold',
}

const COLOR_MAP: Record<string, string> = {
  'red': 'red', 'blue': 'blue', 'green': 'green', 'yellow': 'yellow',
  'black': 'black', 'white': 'white', 'gray': 'gray', 'grey': 'gray',
  'purple': 'purple', 'pink': 'pink', 'indigo': 'indigo', 'teal': 'teal',
  'cyan': 'cyan', 'orange': 'orange', 'amber': 'amber', 'lime': 'lime',
  'emerald': 'emerald', 'violet': 'violet', 'fuchsia': 'fuchsia', 'sky': 'sky',
  'rose': 'rose', 'slate': 'slate', 'zinc': 'zinc', 'neutral': 'neutral',
  'stone': 'stone',
}

function mapColor(val: string, prefix: string): string | null {
  const lower = val.toLowerCase()
  if (lower.startsWith('rgb')) {
    return null
  }
  if (lower.startsWith('#')) {
    const hex = lower.slice(1)
    if (hex.length === 3 || hex.length === 6) return `${prefix}-[${val}]`
    return null
  }
  const namedColor = COLOR_MAP[lower]
  if (namedColor) return `${prefix}-${namedColor}-500`
  return null
}

function parseMarginShorthand(val: string): string {
  const parts = val.trim().split(/\s+/)
  if (parts.length === 1) return mapSpacing(parts[0], 'm') || `m-[${parts[0]}]`
  if (parts.length === 2) {
    const t = mapSpacing(parts[0], 'mt') || `mt-[${parts[0]}]`
    const r = mapSpacing(parts[1], 'mr') || `mr-[${parts[1]}]`
    const b = mapSpacing(parts[0], 'mb') || `mb-[${parts[0]}]`
    const l = mapSpacing(parts[1], 'ml') || `ml-[${parts[1]}]`
    return `${t} ${r} ${b} ${l}`
  }
  if (parts.length === 3) {
    const t = mapSpacing(parts[0], 'mt') || `mt-[${parts[0]}]`
    const r = mapSpacing(parts[1], 'mr') || `mr-[${parts[1]}]`
    const b = mapSpacing(parts[2], 'mb') || `mb-[${parts[2]}]`
    const l = mapSpacing(parts[1], 'ml') || `ml-[${parts[1]}]`
    return `${t} ${r} ${b} ${l}`
  }
  const t = mapSpacing(parts[0], 'mt') || `mt-[${parts[0]}]`
  const r = mapSpacing(parts[1], 'mr') || `mr-[${parts[1]}]`
  const b = mapSpacing(parts[2], 'mb') || `mb-[${parts[2]}]`
  const l = mapSpacing(parts[3], 'ml') || `ml-[${parts[3]}]`
  return `${t} ${r} ${b} ${l}`
}

function parsePaddingShorthand(val: string): string {
  const parts = val.trim().split(/\s+/)
  if (parts.length === 1) return mapSpacing(parts[0], 'p') || `p-[${parts[0]}]`
  if (parts.length === 2) {
    const y = mapSpacing(parts[0], 'py') || `py-[${parts[0]}]`
    const x = mapSpacing(parts[1], 'px') || `px-[${parts[1]}]`
    return `${y} ${x}`
  }
  if (parts.length === 3) {
    const t = mapSpacing(parts[0], 'pt') || `pt-[${parts[0]}]`
    const x = mapSpacing(parts[1], 'px') || `px-[${parts[1]}]`
    const b = mapSpacing(parts[2], 'pb') || `pb-[${parts[2]}]`
    return `${t} ${x} ${b}`
  }
  const t = mapSpacing(parts[0], 'pt') || `pt-[${parts[0]}]`
  const r = mapSpacing(parts[1], 'pr') || `pr-[${parts[1]}]`
  const b = mapSpacing(parts[2], 'pb') || `pb-[${parts[2]}]`
  const l = mapSpacing(parts[3], 'pl') || `pl-[${parts[3]}]`
  return `${t} ${r} ${b} ${l}`
}

function mapSpacing(val: string, prefix: string): string | null {
  const mapped = SPACING_MAP[val.trim()]
  if (mapped) return `${prefix}-${mapped}`
  return null
}

function parseSingleSide(val: string, prefix: string): string {
  const mapped = mapSpacing(val, prefix)
  return mapped || `${prefix}-[${val}]`
}

function mapBorder(val: string): string {
  const parts = val.trim().split(/\s+/)
  const classes: string[] = []
  for (const part of parts) {
    if (part === 'solid' || part === 'dashed' || part === 'dotted' || part === 'none' || part === 'double') {
      continue
    }
    if (part === '0' || part === '0px' || part === 'none') {
      classes.push('border-0')
      continue
    }
    const mapped = SPACING_MAP[part]
    classes.push(mapped ? `border-${mapped}` : `border-[${part}]`)
  }
  return classes.join(' ') || 'border'
}

function mapBorderRadius(val: string): string {
  if (val === '0' || val === '0px') return 'rounded-none'
  if (val === '9999px' || val === '50%') return 'rounded-full'
  const mapped = SPACING_MAP[val.trim()]
  return mapped ? `rounded-${mapped}` : `rounded-[${val}]`
}

const DISPLAY_MAP: Record<string, string> = {
  'flex': 'flex',
  'block': 'block',
  'inline': 'inline',
  'inline-block': 'inline-block',
  'inline-flex': 'inline-flex',
  'grid': 'grid',
  'inline-grid': 'inline-grid',
  'none': 'hidden',
  'hidden': 'hidden',
}

const FLEX_MAP: Record<string, string> = {
  'row': 'flex-row',
  'row-reverse': 'flex-row-reverse',
  'column': 'flex-col',
  'column-reverse': 'flex-col-reverse',
  'wrap': 'flex-wrap',
  'nowrap': 'flex-nowrap',
  'wrap-reverse': 'flex-wrap-reverse',
}

function mapPosition(val: string): string | null {
  const map: Record<string, string> = {
    'relative': 'relative',
    'absolute': 'absolute',
    'fixed': 'fixed',
    'sticky': 'sticky',
    'static': 'static',
  }
  return map[val.trim()] || null
}

function mapOverflow(val: string): string | null {
  const map: Record<string, string> = {
    'hidden': 'overflow-hidden',
    'visible': 'overflow-visible',
    'auto': 'overflow-auto',
    'scroll': 'overflow-scroll',
  }
  return map[val.trim()] || null
}

function mapZIndex(val: string): string | null {
  if (val === '0') return 'z-0'
  if (val === '10') return 'z-10'
  if (val === '20') return 'z-20'
  if (val === '30') return 'z-30'
  if (val === '40') return 'z-40'
  if (val === '50') return 'z-50'
  return `z-[${val}]`
}

function mapTextAlign(val: string): string | null {
  const map: Record<string, string> = {
    'left': 'text-left',
    'center': 'text-center',
    'right': 'text-right',
    'justify': 'text-justify',
  }
  return map[val.trim()] || null
}

function mapTextDecoration(val: string): string | null {
  const map: Record<string, string> = {
    'none': 'no-underline',
    'underline': 'underline',
    'line-through': 'line-through',
  }
  return map[val.trim()] || null
}

function mapTextTransform(val: string): string | null {
  const map: Record<string, string> = {
    'uppercase': 'uppercase',
    'lowercase': 'lowercase',
    'capitalize': 'capitalize',
    'none': 'normal-case',
  }
  return map[val.trim()] || null
}

function mapLineHeight(val: string): string | null {
  if (val === '1') return 'leading-none'
  if (val === '1.25') return 'leading-tight'
  if (val === '1.375') return 'leading-snug'
  if (val === '1.5') return 'leading-normal'
  if (val === '1.625') return 'leading-relaxed'
  if (val === '2') return 'leading-loose'
  return `leading-[${val}]`
}

function mapLetterSpacing(val: string): string | null {
  if (val === '-0.05em') return 'tracking-tighter'
  if (val === '-0.025em') return 'tracking-tight'
  if (val === '0') return 'tracking-normal'
  if (val === '0.025em') return 'tracking-wide'
  if (val === '0.05em') return 'tracking-wider'
  if (val === '0.1em') return 'tracking-widest'
  return `tracking-[${val}]`
}

function convertCssRule(prop: string, val: string): string {
  const p = prop.trim().toLowerCase()
  const v = val.trim()

  if (p === 'display') return DISPLAY_MAP[v] || `[display:${v}]`

  if (p === 'flex-direction' || p === 'flex-wrap' || p === 'flex-shrink' || p === 'flex-grow' || p === 'flex-basis') {
    if (p === 'flex-direction') return FLEX_MAP[v] || `flex-direction-[${v}]`
    if (p === 'flex-wrap') return FLEX_MAP[v] || `flex-wrap-[${v}]`
    if (p === 'flex-shrink') return v === '0' ? 'flex-shrink-0' : `flex-shrink-[${v}]`
    if (p === 'flex-grow') return v === '0' ? 'flex-grow-0' : v === '1' ? 'flex-grow' : `flex-grow-[${v}]`
    if (p === 'flex-basis') return mapSpacing(v, 'basis') || `basis-[${v}]`
  }

  if (p === 'justify-content') {
    const map: Record<string, string> = {
      'flex-start': 'justify-start', 'flex-end': 'justify-end', 'center': 'justify-center',
      'space-between': 'justify-between', 'space-around': 'justify-around', 'space-evenly': 'justify-evenly',
    }
    return map[v] || `justify-[${v}]`
  }

  if (p === 'align-items') {
    const map: Record<string, string> = {
      'flex-start': 'items-start', 'flex-end': 'items-end', 'center': 'items-center',
      'stretch': 'items-stretch', 'baseline': 'items-baseline',
    }
    return map[v] || `items-[${v}]`
  }

  if (p === 'align-self') {
    const map: Record<string, string> = {
      'auto': 'self-auto', 'flex-start': 'self-start', 'flex-end': 'self-end', 'center': 'self-center', 'stretch': 'self-stretch',
    }
    return map[v] || `self-[${v}]`
  }

  if (p === 'gap') return mapSpacing(v, 'gap') || `gap-[${v}]`
  if (p === 'row-gap') return mapSpacing(v, 'gap-y') || `gap-y-[${v}]`
  if (p === 'column-gap') return mapSpacing(v, 'gap-x') || `gap-x-[${v}]`

  if (p === 'grid-template-columns') return v.includes('1fr') ? `grid-cols-${v.split(' ').length}` : `grid-template-columns-[${v}]`
  if (p === 'grid-template-rows') return v.includes('1fr') ? `grid-rows-${v.split(' ').length}` : `grid-template-rows-[${v}]`
  if (p === 'grid-column') return `col-span-[${v}]`
  if (p === 'grid-row') return `row-span-[${v}]`

  if (p === 'margin') return parseMarginShorthand(v)
  if (p === 'margin-top') return parseSingleSide(v, 'mt')
  if (p === 'margin-right') return parseSingleSide(v, 'mr')
  if (p === 'margin-bottom') return parseSingleSide(v, 'mb')
  if (p === 'margin-left') return parseSingleSide(v, 'ml')

  if (p === 'padding') return parsePaddingShorthand(v)
  if (p === 'padding-top') return parseSingleSide(v, 'pt')
  if (p === 'padding-right') return parseSingleSide(v, 'pr')
  if (p === 'padding-bottom') return parseSingleSide(v, 'pb')
  if (p === 'padding-left') return parseSingleSide(v, 'pl')

  if (p === 'width') return mapSpacing(v, 'w') || `w-[${v}]`
  if (p === 'height') return mapSpacing(v, 'h') || `h-[${v}]`
  if (p === 'min-width') return mapSpacing(v, 'min-w') || `min-w-[${v}]`
  if (p === 'min-height') return mapSpacing(v, 'min-h') || `min-h-[${v}]`
  if (p === 'max-width') return mapSpacing(v, 'max-w') || `max-w-[${v}]`
  if (p === 'max-height') return mapSpacing(v, 'max-h') || `max-h-[${v}]`

  if (p === 'font-size') return FONT_SIZE_MAP[v] || `text-[${v}]`
  if (p === 'font-weight') return FONT_WEIGHT_MAP[v] || `font-[${v}]`
  if (p === 'font-style') {
    if (v === 'italic') return 'italic'
    if (v === 'normal') return 'not-italic'
    return `font-style-[${v}]`
  }
  if (p === 'font-family') return `font-[${v}]`
  if (p === 'line-height') return mapLineHeight(v) || `leading-[${v}]`
  if (p === 'letter-spacing') return mapLetterSpacing(v) || `tracking-[${v}]`
  if (p === 'text-align') return mapTextAlign(v) || `text-align-[${v}]`
  if (p === 'text-decoration') return mapTextDecoration(v) || `decoration-[${v}]`
  if (p === 'text-transform') return mapTextTransform(v) || `text-transform-[${v}]`
  if (p === 'white-space') {
    if (v === 'nowrap') return 'whitespace-nowrap'
    if (v === 'pre') return 'whitespace-pre'
    if (v === 'normal') return 'whitespace-normal'
    return `whitespace-[${v}]`
  }
  if (p === 'text-indent') return `indent-[${v}]`
  if (p === 'word-spacing') return `word-spacing-[${v}]`
  if (p === 'vertical-align') {
    const map: Record<string, string> = { 'top': 'align-top', 'middle': 'align-middle', 'bottom': 'align-bottom', 'baseline': 'align-baseline', 'sub': 'align-sub', 'super': 'align-super' }
    return map[v] || `align-[${v}]`
  }

  if (p === 'color') return mapColor(v, 'text') || `text-[${v}]`
  if (p === 'background-color') return mapColor(v, 'bg') || `bg-[${v}]`

  if (p === 'border') return mapBorder(v)
  if (p === 'border-top') return mapBorder(v).replace('border', 'border-t')
  if (p === 'border-right') return mapBorder(v).replace('border', 'border-r')
  if (p === 'border-bottom') return mapBorder(v).replace('border', 'border-b')
  if (p === 'border-left') return mapBorder(v).replace('border', 'border-l')
  if (p === 'border-width') return mapBorder(`${v} solid`)
  if (p === 'border-color') return mapColor(v, 'border') || `border-[${v}]`
  if (p === 'border-radius') return mapBorderRadius(v)

  if (p === 'position') return mapPosition(v) || `position-[${v}]`
  if (p === 'top') return mapSpacing(v, 'top') || `top-[${v}]`
  if (p === 'right') return mapSpacing(v, 'right') || `right-[${v}]`
  if (p === 'bottom') return mapSpacing(v, 'bottom') || `bottom-[${v}]`
  if (p === 'left') return mapSpacing(v, 'left') || `left-[${v}]`

  if (p === 'z-index') return mapZIndex(v) || `z-[${v}]`
  if (p === 'overflow') return mapOverflow(v) || `overflow-[${v}]`
  if (p === 'overflow-x') return v === 'hidden' ? 'overflow-x-hidden' : v === 'auto' ? 'overflow-x-auto' : `overflow-x-[${v}]`
  if (p === 'overflow-y') return v === 'hidden' ? 'overflow-y-hidden' : v === 'auto' ? 'overflow-y-auto' : `overflow-y-[${v}]`

  if (p === 'opacity') return v === '0' ? 'opacity-0' : v === '1' ? 'opacity-100' : `opacity-[${v}]`

  if (p === 'box-shadow') return v === 'none' ? 'shadow-none' : `shadow-[${v}]`

  if (p === 'cursor') {
    const map: Record<string, string> = { 'pointer': 'cursor-pointer', 'default': 'cursor-default', 'text': 'cursor-text', 'move': 'cursor-move', 'not-allowed': 'cursor-not-allowed' }
    return map[v] || `cursor-[${v}]`
  }

  if (p === 'transition') return `transition-[${v}]`
  if (p === 'transition-duration') return `duration-[${v}]`
  if (p === 'transition-timing-function') return `ease-[${v}]`
  if (p === 'transition-delay') return `delay-[${v}]`

  if (p === 'transform') return `transform-[${v}]`
  if (p === 'transform-origin') return `origin-[${v}]`

  if (p === 'resize') {
    if (v === 'none') return 'resize-none'
    if (v === 'both') return 'resize'
    if (v === 'horizontal') return 'resize-x'
    if (v === 'vertical') return 'resize-y'
    return `resize-[${v}]`
  }

  if (p === 'user-select') {
    if (v === 'none') return 'select-none'
    if (v === 'text') return 'select-text'
    if (v === 'all') return 'select-all'
    return `select-[${v}]`
  }

  if (p === 'pointer-events') return v === 'none' ? 'pointer-events-none' : v === 'auto' ? 'pointer-events-auto' : `pointer-events-[${v}]`

  if (p === 'visibility') return v === 'visible' ? 'visible' : v === 'hidden' ? 'invisible' : `visibility-[${v}]`

  if (p === 'list-style-type') return `list-[${v}]`
  if (p === 'list-style-position') return v === 'inside' ? 'list-inside' : v === 'outside' ? 'list-outside' : `list-position-[${v}]`

  if (p === 'table-layout') return v === 'fixed' ? 'table-fixed' : v === 'auto' ? 'table-auto' : `table-[${v}]`
  if (p === 'caption-side') return v === 'top' ? 'caption-top' : v === 'bottom' ? 'caption-bottom' : `caption-[${v}]`
  if (p === 'border-collapse') return v === 'collapse' ? 'border-collapse' : v === 'separate' ? 'border-separate' : `border-collapse-[${v}]`

  if (p === 'word-break') return v === 'break-all' ? 'break-all' : v === 'break-word' ? 'break-words' : `break-[${v}]`
  if (p === 'overflow-wrap') return v === 'break-word' ? 'break-words' : v === 'anywhere' ? 'break-all' : `break-[${v}]`

  return `[${p}:${v}]`
}

function convertCssToTailwind(css: string): string {
  const lines = css.split('\n')
  const result: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed === '{' || trimmed === '}') {
      continue
    }

    const colonIdx = trimmed.indexOf(':')
    if (colonIdx === -1) continue

    const prop = trimmed.slice(0, colonIdx).trim()
    let val = trimmed.slice(colonIdx + 1).trim()
    if (val.endsWith(';')) val = val.slice(0, -1).trim()

    if (!val) continue

    const classes = convertCssRule(prop, val)
    if (classes) {
      result.push(classes)
    }
  }

  return result.join(' ')
}

export default function CssToTailwind() {
  const [input, setInput] = useState(
`display: flex;
justify-content: center;
align-items: center;
margin: 16px;
padding: 8px 12px;
font-size: 14px;
font-weight: 600;
color: #ef4444;
background-color: blue;
border: 1px solid black;
border-radius: 8px;
text-align: center;
text-decoration: underline;
gap: 8px;
width: 100%;
height: 48px;
position: relative;
overflow: hidden;
opacity: 0.8;
z-index: 10;
cursor: pointer;
transition: all 0.2s;`
  )
  const [output, setOutput] = useState('')
  const [copied, setCopied] = useState(false)

  const handleChange = useCallback((val: string) => {
    setInput(val)
    try {
      const tailwind = convertCssToTailwind(val)
      setOutput(tailwind)
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
        <label className="block text-sm font-medium mb-1 text-[var(--color-text)]">CSS Input</label>
        <textarea
          className="w-full h-64 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 font-mono text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-y"
          placeholder="Paste CSS rules..."
          value={input}
          onChange={(e) => handleChange(e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        {output && (
          <button onClick={copyToClipboard} className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-colors">
            {copied ? 'Copied!' : 'Copy Tailwind'}
          </button>
        )}
      </div>

      {output && (
        <div>
          <label className="block text-sm font-medium mb-1 text-[var(--color-text)]">Tailwind Output</label>
          <textarea
            className="w-full h-32 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3 font-mono text-sm text-[var(--color-text)] resize-y"
            readOnly
            value={output}
          />
        </div>
      )}
    </div>
  )
}
