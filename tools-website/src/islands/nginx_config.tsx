import { useState, useCallback } from 'react'

type Template = 'reverse_proxy' | 'static' | 'ssl' | 'load_balancer'

interface FieldDef {
  key: string
  label: string
  placeholder: string
  default: string
}

const TEMPLATES: Record<Template, { label: string; fields: FieldDef[]; generate: (v: Record<string, string>) => string }> = {
  reverse_proxy: {
    label: 'Reverse Proxy',
    fields: [
      { key: 'domain', label: 'Domain', placeholder: 'example.com', default: 'example.com' },
      { key: 'upstream_port', label: 'Upstream Port', placeholder: '3000', default: '3000' },
      { key: 'proxy_pass', label: 'Proxy Pass', placeholder: 'http://127.0.0.1:3000', default: 'http://127.0.0.1:3000' },
    ],
    generate: (v) => `server {
    listen 80;
    server_name ${v.domain};

    location / {
        proxy_pass ${v.proxy_pass};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}`,
  },
  static: {
    label: 'Static Files',
    fields: [
      { key: 'domain', label: 'Domain', placeholder: 'example.com', default: 'example.com' },
      { key: 'root', label: 'Root Directory', placeholder: '/var/www/html', default: '/var/www/html' },
      { key: 'index', label: 'Index File', placeholder: 'index.html', default: 'index.html' },
    ],
    generate: (v) => `server {
    listen 80;
    server_name ${v.domain};
    root ${v.root};
    index ${v.index};

    location / {
        try_files $uri $uri/ =404;
    }

    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}`,
  },
  ssl: {
    label: 'SSL',
    fields: [
      { key: 'domain', label: 'Domain', placeholder: 'example.com', default: 'example.com' },
      { key: 'ssl_cert', label: 'SSL Certificate', placeholder: '/etc/letsencrypt/live/example.com/fullchain.pem', default: '/etc/letsencrypt/live/example.com/fullchain.pem' },
      { key: 'ssl_key', label: 'SSL Key', placeholder: '/etc/letsencrypt/live/example.com/privkey.pem', default: '/etc/letsencrypt/live/example.com/privkey.pem' },
      { key: 'upstream_port', label: 'Upstream Port', placeholder: '3000', default: '3000' },
    ],
    generate: (v) => `server {
    listen 80;
    server_name ${v.domain};
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${v.domain};

    ssl_certificate ${v.ssl_cert};
    ssl_certificate_key ${v.ssl_key};
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location / {
        proxy_pass http://127.0.0.1:${v.upstream_port};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}`,
  },
  load_balancer: {
    label: 'Load Balancer',
    fields: [
      { key: 'domain', label: 'Domain', placeholder: 'example.com', default: 'example.com' },
      { key: 'upstreams', label: 'Upstream Servers (one per line)', placeholder: '127.0.0.1:3000\n127.0.0.1:3001\n127.0.0.1:3002', default: '127.0.0.1:3000\n127.0.0.1:3001' },
      { key: 'method', label: 'Load Balance Method', placeholder: 'round_robin / least_conn / ip_hash', default: 'least_conn' },
    ],
    generate: (v) => {
      const servers = v.upstreams.split('\n').filter(Boolean).map(s => `        server ${s.trim()};`).join('\n')
      return `upstream backend {
    ${v.method === 'ip_hash' ? 'ip_hash;' : v.method === 'least_conn' ? 'least_conn;' : ''}
${servers}
}

server {
    listen 80;
    server_name ${v.domain};

    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 5s;
        proxy_read_timeout 60s;
    }
}`
    },
  },
}

const TEMPLATE_KEYS: Template[] = ['reverse_proxy', 'static', 'ssl', 'load_balancer']

export default function NginxConfig() {
  const [template, setTemplate] = useState<Template>('reverse_proxy')
  const [values, setValues] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState(false)
  const [downloaded, setDownloaded] = useState(false)

  const current = TEMPLATES[template]

  const getValue = useCallback(
    (key: string, placeholder: string) => values[`${template}:${key}`] ?? placeholder,
    [template, values],
  )

  const generated = current.fields.reduce(
    (acc, f) => acc.replace(new RegExp(`\\$\\{v\\.${f.key}\\}`, 'g'), getValue(f.key, f.default)),
    current.generate(
      Object.fromEntries(current.fields.map((f) => [f.key, getValue(f.key, f.default)])),
    ),
  )

  const handleGenerate = useCallback(() => {
    setValues((prev) => ({ ...prev }))
  }, [])

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(generated)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [generated])

  const download = useCallback(() => {
    const blob = new Blob([generated], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'nginx.conf'
    a.click()
    URL.revokeObjectURL(url)
    setDownloaded(true)
    setTimeout(() => setDownloaded(false), 1500)
  }, [generated])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-[var(--color-text-secondary)]">Template</label>
        <div className="flex flex-wrap gap-2">
          {TEMPLATE_KEYS.map((t) => (
            <button
              key={t}
              onClick={() => setTemplate(t)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                template === t
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]'
              }`}
            >
              {TEMPLATES[t].label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {current.fields.map((f) => (
          <div key={f.key} className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[var(--color-text-secondary)]">{f.label}</label>
            {f.key === 'upstreams' ? (
              <textarea
                className="w-full h-24 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 font-mono text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-y"
                placeholder={f.placeholder}
                value={getValue(f.key, '')}
                onChange={(e) => setValues((prev) => ({ ...prev, [`${template}:${f.key}`]: e.target.value }))}
              />
            ) : (
              <input
                type="text"
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 font-mono text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                placeholder={f.placeholder}
                value={getValue(f.key, '')}
                onChange={(e) => setValues((prev) => ({ ...prev, [`${template}:${f.key}`]: e.target.value }))}
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={handleGenerate} className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] transition-colors">
          Generate
        </button>
        <button onClick={copyToClipboard} className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors">
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <button onClick={download} className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors">
          {downloaded ? 'Downloaded!' : 'Download nginx.conf'}
        </button>
      </div>

      <pre className="w-full min-h-[16rem] overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 font-mono text-sm text-[var(--color-text)] whitespace-pre-wrap">
        {generated}
      </pre>
    </div>
  )
}
