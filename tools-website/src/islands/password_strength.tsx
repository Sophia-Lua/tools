import { useState, useCallback } from 'react'

const COMMON_PATTERNS = [
  'password', '123456', 'qwerty', 'abc123', 'letmein', 'admin',
  'welcome', 'monkey', 'master', 'dragon', 'login', 'princess',
  'football', 'shadow', 'sunshine', 'trustno1', 'iloveyou', 'batman',
]

function analyzeStrength(password: string) {
  let score = 0
  const suggestions: string[] = []

  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasDigit = /\d/.test(password)
  const hasSpecial = /[^A-Za-z0-9]/.test(password)
  const hasLength = password.length >= 8
  const hasLong = password.length >= 12

  if (hasUpper) score += 15
  else suggestions.push('Add uppercase letters')

  if (hasLower) score += 15
  else suggestions.push('Add lowercase letters')

  if (hasDigit) score += 15
  else suggestions.push('Add digits')

  if (hasSpecial) score += 20
  else suggestions.push('Add special characters (!@#$%^&*)')

  if (hasLength) score += 10
  else suggestions.push('Use at least 8 characters')

  if (hasLong) score += 10
  else suggestions.push('Use 12+ characters for better security')

  if (password.length > 16) score += 10
  if (password.length > 20) score += 5

  const lowerPw = password.toLowerCase()
  if (COMMON_PATTERNS.some((p) => lowerPw.includes(p))) {
    score -= 30
    suggestions.push('Avoid common passwords or patterns')
  }

  if (/(.)\1{2,}/.test(password)) {
    score -= 10
    suggestions.push('Avoid repeated characters')
  }

  if (/^[a-zA-Z]+$/.test(password)) {
    score -= 5
    suggestions.push('Mix letters with numbers and symbols')
  }

  if (/^[0-9]+$/.test(password)) {
    score -= 15
    suggestions.push('Don\'t use only numbers')
  }

  score = Math.max(0, Math.min(100, score))

  let level: string
  let color: string
  let width: string

  if (score < 25) {
    level = 'Weak'
    color = '#ef4444'
    width = '20%'
  } else if (score < 50) {
    level = 'Fair'
    color = '#f59e0b'
    width = '45%'
  } else if (score < 70) {
    level = 'Good'
    color = '#eab308'
    width = '65%'
  } else if (score < 90) {
    level = 'Strong'
    color = '#22c55e'
    width = '85%'
  } else {
    level = 'Very Strong'
    color = '#3b82f6'
    width = '100%'
  }

  let crackTime: string
  if (password.length === 0) {
    crackTime = 'N/A'
  } else {
    const charsetSize =
      (hasUpper ? 26 : 0) + (hasLower ? 26 : 0) + (hasDigit ? 10 : 0) + (hasSpecial ? 32 : 0) || 1
    const combinations = Math.pow(charsetSize, password.length)
    const seconds = combinations / 1e10
    if (seconds < 1) crackTime = 'Instant'
    else if (seconds < 60) crackTime = `${Math.round(seconds)} seconds`
    else if (seconds < 3600) crackTime = `${Math.round(seconds / 60)} minutes`
    else if (seconds < 86400) crackTime = `${Math.round(seconds / 3600)} hours`
    else if (seconds < 31536000) crackTime = `${Math.round(seconds / 86400)} days`
    else if (seconds < 31536000 * 1000) crackTime = `${Math.round(seconds / 31536000)} years`
    else if (seconds < 31536000 * 1e6) crackTime = `${Math.round(seconds / 31536000 / 1000)}k years`
    else if (seconds < 31536000 * 1e9) crackTime = `${Math.round(seconds / 31536000 / 1e6)}M years`
    else crackTime = 'Centuries+'
  }

  return { score, level, color, width, suggestions, crackTime }
}

export default function PasswordStrength() {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const result = password ? analyzeStrength(password) : null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 pr-12 font-mono text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            placeholder="Enter a password..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      {result && (
        <div className="flex flex-col gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Strength</span>
              <span className="text-sm font-semibold" style={{ color: result.color }}>{result.level}</span>
            </div>
            <div className="h-3 rounded-full" style={{ backgroundColor: 'var(--color-border)' }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: result.width, backgroundColor: result.color }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-[var(--color-text-secondary)]">0</span>
              <span className="text-xs text-[var(--color-text-secondary)]">100</span>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--color-text)' }}>Estimated crack time:</span>
              <span className="text-sm font-semibold" style={{ color: result.color }}>{result.crackTime}</span>
            </div>
          </div>

          {result.suggestions.length > 0 && (
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              <span className="text-sm font-medium block mb-2" style={{ color: 'var(--color-text)' }}>Suggestions</span>
              <ul className="space-y-1">
                {result.suggestions.map((s, i) => (
                  <li key={i} className="text-xs flex items-start gap-2" style={{ color: 'var(--color-text-secondary)' }}>
                    <span className="text-[var(--color-primary)]">•</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
