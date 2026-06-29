import { useState, useCallback, useEffect } from 'react'

interface BrowserInfo {
  userAgent: string
  platform: string
  language: string
  cookiesEnabled: boolean
  screenSize: string
  colorDepth: number
  timezone: string
}

function getLocalIPs(): Promise<string[]> {
  return new Promise((resolve) => {
    try {
      const pc = new RTCPeerConnection({ iceServers: [] })
      pc.createDataChannel('')
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .catch(() => {
          resolve([])
          return
        })

      const ips = new Set<string>()
      let resolved = false

      pc.onicecandidate = (event) => {
        if (!event.candidate || resolved) return
        const candidate = event.candidate.candidate
        const match = candidate.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/)
        if (match && match[1] !== '0.0.0.0') {
          ips.add(match[1])
        }
      }

      setTimeout(() => {
        resolved = true
        pc.close()
        resolve(Array.from(ips))
      }, 1000)
    } catch {
      resolve([])
    }
  })
}

function getBrowserInfo(): BrowserInfo {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    cookiesEnabled: navigator.cookieEnabled,
    screenSize: `${window.screen.width}x${window.screen.height}`,
    colorDepth: window.screen.colorDepth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }
}

export default function IpLookup() {
  const [localIPs, setLocalIPs] = useState<string[]>([])
  const [publicIP, setPublicIP] = useState('')
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState('')
  const [showPublic, setShowPublic] = useState(false)

  useEffect(() => {
    getLocalIPs().then(setLocalIPs)
    setBrowserInfo(getBrowserInfo())
  }, [])

  const fetchPublicIP = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('https://api.ipify.org?format=json')
      const data = await res.json()
      setPublicIP(data.ip)
      setShowPublic(true)
    } catch {
      setPublicIP('Failed to fetch')
      setShowPublic(true)
    } finally {
      setLoading(false)
    }
  }, [])

  const copyIP = useCallback((ip: string) => {
    navigator.clipboard.writeText(ip)
    setCopied(ip)
    setTimeout(() => setCopied(''), 1500)
  }, [])

  const card = (title: string, children: React.ReactNode) => (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">{title}</h3>
      {children}
    </div>
  )

  const row = (label: string, value: string, onCopy?: () => void, isCopied?: boolean) => (
    <div className="flex items-center justify-between py-1.5 border-b border-[var(--color-border)] last:border-0">
      <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
      <div className="flex items-center gap-2">
        <code className="font-mono text-sm text-[var(--color-text)]">{value}</code>
        {onCopy && (
          <button onClick={onCopy} className="rounded px-2 py-0.5 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors">
            {isCopied ? 'Copied!' : 'Copy'}
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      {card(
        'Local IP Addresses',
        localIPs.length > 0 ? (
          localIPs.map((ip) => (
            <div key={ip} className="flex items-center justify-between py-1.5 border-b border-[var(--color-border)] last:border-0">
              <code className="font-mono text-sm text-[var(--color-text)]">{ip}</code>
              <button onClick={() => copyIP(ip)} className="rounded px-2 py-0.5 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors">
                {copied === ip ? 'Copied!' : 'Copy'}
              </button>
            </div>
          ))
        ) : (
          <p className="text-sm text-[var(--color-text-tertiary)]">Detecting...</p>
        ),
      )}

      {card(
        'Public IP Address',
        <div>
          {showPublic ? (
            <div className="flex items-center justify-between py-1.5">
              <code className="font-mono text-sm text-[var(--color-text)]">{publicIP}</code>
              {publicIP !== 'Failed to fetch' && (
                <button onClick={() => copyIP(publicIP)} className="rounded px-2 py-0.5 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors">
                  {copied === publicIP ? 'Copied!' : 'Copy'}
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={fetchPublicIP}
              disabled={loading}
              className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50"
            >
              {loading ? 'Fetching...' : 'Fetch Public IP'}
            </button>
          )}
        </div>,
      )}

      {browserInfo && card(
        'Browser Information',
        <div>
          {row('User Agent', browserInfo.userAgent)}
          {row('Platform', browserInfo.platform)}
          {row('Language', browserInfo.language)}
          {row('Cookies Enabled', browserInfo.cookiesEnabled ? 'Yes' : 'No')}
          {row('Screen Size', browserInfo.screenSize)}
          {row('Color Depth', `${browserInfo.colorDepth}-bit`)}
          {row('Timezone', browserInfo.timezone)}
        </div>,
      )}
    </div>
  )
}
