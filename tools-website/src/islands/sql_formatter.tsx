import { useState, useCallback } from 'react'

const SQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'ON', 'AS',
  'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'FULL', 'CROSS',
  'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET', 'DISTINCT',
  'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE',
  'CREATE', 'ALTER', 'DROP', 'TABLE', 'INDEX', 'VIEW',
  'PRIMARY KEY', 'FOREIGN KEY', 'REFERENCES', 'CONSTRAINT',
  'UNIQUE', 'CHECK', 'DEFAULT', 'NULL', 'IS', 'BETWEEN', 'LIKE',
  'EXISTS', 'ANY', 'ALL', 'UNION', 'INTERSECT', 'EXCEPT',
  'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'ASC', 'DESC',
  'IF', 'IFNULL', 'COALESCE', 'CAST', 'CONVERT', 'TRIM',
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'ROUND',
  'WITH', 'RECURSIVE', 'AS', 'OVER', 'PARTITION', 'ROW_NUMBER',
  'RANK', 'DENSE_RANK', 'LAG', 'LEAD', 'FIRST_VALUE', 'LAST_VALUE',
]

const CLAUSE_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'GROUP BY', 'ORDER BY',
  'HAVING', 'LIMIT', 'OFFSET', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN',
  'INNER JOIN', 'OUTER JOIN', 'FULL JOIN', 'CROSS JOIN', 'ON',
  'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM',
  'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE',
  'WITH', 'UNION', 'INTERSECT', 'EXCEPT',
]

function formatSql(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return ''

  let result = trimmed

  // Normalize whitespace
  result = result.replace(/\s+/g, ' ')

  // Uppercase keywords
  let upperResult = result
  const sortedKeywords = [...SQL_KEYWORDS].sort((a, b) => b.length - a.length)
  for (const kw of sortedKeywords) {
    const regex = new RegExp(`\\b${kw.replace(/ /g, '\\s+')}\\b`, 'gi')
    upperResult = upperResult.replace(regex, kw)
  }

  // Add newlines before major clauses
  const majorClauses = [
    'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING',
    'LIMIT', 'OFFSET', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN',
    'INNER JOIN', 'OUTER JOIN', 'FULL JOIN', 'CROSS JOIN',
    'INSERT INTO', 'VALUES', 'SET', 'ON', 'UNION',
    'WITH', 'INTERSECT', 'EXCEPT',
  ]

  let lines: string[] = [upperResult]
  for (const clause of majorClauses) {
    const newLines: string[] = []
    for (const line of lines) {
      const parts = line.split(new RegExp(`\\b(${clause.replace(/ /g, '\\s+')})\\b`, 'i'))
      for (let j = 0; j < parts.length; j++) {
        if (j > 0) {
          newLines.push(clause)
        }
        if (parts[j]) newLines.push(parts[j])
      }
    }
    lines = newLines
  }

  // Indent and/orn
  const indented: string[] = []
  for (const line of lines) {
    const trimmedLine = line.trim()
    if (trimmedLine.toUpperCase() === 'AND' || trimmedLine.toUpperCase() === 'OR') {
      indented.push('  ' + trimmedLine)
    } else if (trimmedLine.toUpperCase().startsWith('AND ') || trimmedLine.toUpperCase().startsWith('OR ')) {
      indented.push('  ' + trimmedLine)
    } else {
      indented.push(trimmedLine)
    }
  }

  return indented.filter(Boolean).join('\n')
}

function minifySql(input: string): string {
  return input
    .replace(/\s+/g, ' ')
    .replace(/\s*([(),])\s*/g, '$1')
    .trim()
}

function toggleCase(input: string): string {
  let upper = true
  for (const ch of input) {
    if (/[a-zA-Z]/.test(ch)) {
      upper = ch === ch.toUpperCase()
      break
    }
  }

  if (upper) {
    return input.toLowerCase().replace(
      /\b(SELECT|FROM|WHERE|AND|OR|NOT|IN|ON|AS|JOIN|LEFT|RIGHT|INNER|OUTER|FULL|CROSS|GROUP BY|ORDER BY|HAVING|LIMIT|OFFSET|DISTINCT|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|ALTER|DROP|TABLE|INDEX|VIEW|PRIMARY KEY|FOREIGN KEY|REFERENCES|CONSTRAINT|UNIQUE|CHECK|DEFAULT|NULL|IS|BETWEEN|LIKE|EXISTS|ANY|ALL|UNION|INTERSECT|EXCEPT|CASE|WHEN|THEN|ELSE|END|ASC|DESC)\b/g,
      (m) => m.toUpperCase()
    )
  }
  return input.toUpperCase()
}

export default function SqlFormatter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [copied, setCopied] = useState(false)

  const handleFormat = useCallback(() => {
    setOutput(formatSql(input))
    setCopied(false)
  }, [input])

  const handleMinify = useCallback(() => {
    setOutput(minifySql(input))
    setCopied(false)
  }, [input])

  const handleToggleCase = useCallback(() => {
    setOutput(toggleCase(output || input))
    setCopied(false)
  }, [input, output])

  const copyToClipboard = useCallback(() => {
    if (output) {
      navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }, [output])

  const textareaClass = 'w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 font-mono text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-y'

  return (
    <div className="flex flex-col gap-4">
      <textarea
        className={`${textareaClass} h-40`}
        placeholder="Paste SQL here..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <div className="flex flex-wrap gap-2">
        <button onClick={handleFormat} className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] transition-colors">
          Format
        </button>
        <button onClick={handleMinify} className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors">
          Minify
        </button>
        <button onClick={handleToggleCase} className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors">
          Toggle Case
        </button>
        {output && (
          <button onClick={copyToClipboard} className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors">
            {copied ? 'Copied!' : 'Copy'}
          </button>
        )}
      </div>

      {output && (
        <textarea
          readOnly
          className={`${textareaClass} h-48`}
          value={output}
        />
      )}
    </div>
  )
}
