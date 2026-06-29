import { useState, useCallback } from 'react'

interface Service {
  id: string
  name: string
  image: string
  ports: string
  envVars: string
  volumes: string
}

const TEMPLATES: Record<string, Partial<Service>> = {
  nginx: { image: 'nginx:latest', ports: '80:80\n443:443', envVars: '', volumes: './html:/usr/share/nginx/html' },
  postgres: { image: 'postgres:16-alpine', ports: '5432:5432', envVars: 'POSTGRES_USER=admin\nPOSTGRES_PASSWORD=secret\nPOSTGRES_DB=mydb', volumes: 'pgdata:/var/lib/postgresql/data' },
  redis: { image: 'redis:alpine', ports: '6379:6379', envVars: '', volumes: 'redisdata:/data' },
  mysql: { image: 'mysql:8', ports: '3306:3306', envVars: 'MYSQL_ROOT_PASSWORD=root\nMYSQL_DATABASE=mydb\nMYSQL_USER=user\nMYSQL_PASSWORD=pass', volumes: 'mysqldata:/var/lib/mysql' },
  mongo: { image: 'mongo:7', ports: '27017:27017', envVars: 'MONGO_INITDB_ROOT_USERNAME=admin\nMONGO_INITDB_ROOT_PASSWORD=secret', volumes: 'mongodata:/data/db' },
}

let nextId = 0

function makeService(): Service {
  return { id: `s${nextId++}`, name: '', image: '', ports: '', envVars: '', volumes: '' }
}

function generateYaml(services: Service[]): string {
  const lines = ['version: "3.8"', '', 'services:']

  for (const svc of services) {
    const name = svc.name || `service-${services.indexOf(svc) + 1}`
    lines.push(`  ${name}:`)
    lines.push(`    image: ${svc.image || 'alpine:latest'}`)

    const ports = svc.ports.split('\n').map((l) => l.trim()).filter(Boolean)
    if (ports.length) {
      lines.push('    ports:')
      ports.forEach((p) => lines.push(`      - "${p}"`))
    }

    const envs = svc.envVars.split('\n').map((l) => l.trim()).filter(Boolean)
    if (envs.length) {
      lines.push('    environment:')
      envs.forEach((e) => {
        const eqIdx = e.indexOf('=')
        if (eqIdx > -1) {
          lines.push(`      ${e.substring(0, eqIdx)}: "${e.substring(eqIdx + 1)}"`)
        } else {
          lines.push(`      ${e}`)
        }
      })
    }

    const vols = svc.volumes.split('\n').map((l) => l.trim()).filter(Boolean)
    if (vols.length) {
      lines.push('    volumes:')
      vols.forEach((v) => lines.push(`      - ${v}`))
    }
  }

  const hasNamedVolumes = services.some((s) => s.volumes.split('\n').some((l) => l.trim() && !l.includes('.') && !l.includes('/')))
  if (hasNamedVolumes) {
    lines.push('', 'volumes:')
    const namedVols = new Set<string>()
    services.forEach((s) => {
      s.volumes.split('\n').forEach((l) => {
        const trimmed = l.trim()
        if (trimmed && !trimmed.includes('.') && !trimmed.includes('/')) {
          namedVols.add(trimmed)
        }
      })
    })
    namedVols.forEach((v) => lines.push(`  ${v}:`))
  }

  return lines.join('\n')
}

export default function DockerCompose() {
  const [services, setServices] = useState<Service[]>([{ ...makeService() }])
  const [output, setOutput] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const addService = useCallback(() => {
    setServices((prev) => [...prev, makeService()])
  }, [])

  const removeService = useCallback((id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const updateService = useCallback((id: string, field: keyof Service, value: string) => {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)))
  }, [])

  const applyTemplate = useCallback((id: string, template: string) => {
    const tmpl = TEMPLATES[template]
    if (!tmpl) return
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...tmpl, name: template } : s))
    )
  }, [])

  const generate = useCallback(() => {
    try {
      if (services.every((s) => !s.image)) {
        setError('At least one service needs an image')
        setOutput('')
        return
      }
      setOutput(generateYaml(services))
      setError('')
      setCopied(false)
    } catch (e: any) {
      setError(`Error: ${e.message}`)
      setOutput('')
    }
  }, [services])

  const copyToClipboard = useCallback(() => {
    if (output) {
      navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }, [output])

  const download = useCallback(() => {
    if (!output) return
    const blob = new Blob([output], { type: 'text/yaml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'docker-compose.yml'
    a.click()
    URL.revokeObjectURL(url)
  }, [output])

  const inputCls = 'w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-sm font-mono text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-y'
  const labelCls = 'text-xs font-medium mb-1 block'

  return (
    <div className="flex flex-col gap-4">
      {services.map((svc, idx) => (
        <div key={svc.id} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              Service {idx + 1}
            </span>
            {services.length > 1 && (
              <button onClick={() => removeService(svc.id)} className="text-xs text-[var(--color-error)] hover:opacity-80 transition-opacity">
                Remove
              </button>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            <span className="text-xs text-[var(--color-text-secondary)]">Templates:</span>
            {Object.keys(TEMPLATES).map((t) => (
              <button key={t} onClick={() => applyTemplate(svc.id, t)} className="text-xs px-2 py-0.5 rounded bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 transition-colors">
                {t}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} style={{ color: 'var(--color-text-secondary)' }}>Name</label>
              <input className={inputCls} placeholder="my-service" value={svc.name} onChange={(e) => updateService(svc.id, 'name', e.target.value)} />
            </div>
            <div>
              <label className={labelCls} style={{ color: 'var(--color-text-secondary)' }}>Image</label>
              <input className={inputCls} placeholder="nginx:latest" value={svc.image} onChange={(e) => updateService(svc.id, 'image', e.target.value)} />
            </div>
          </div>

          <div>
            <label className={labelCls} style={{ color: 'var(--color-text-secondary)' }}>Ports (host:container, one per line)</label>
            <textarea className={`${inputCls} h-16`} placeholder="80:80" value={svc.ports} onChange={(e) => updateService(svc.id, 'ports', e.target.value)} />
          </div>

          <div>
            <label className={labelCls} style={{ color: 'var(--color-text-secondary)' }}>Environment Variables (KEY=value, one per line)</label>
            <textarea className={`${inputCls} h-16`} placeholder="NODE_ENV=production" value={svc.envVars} onChange={(e) => updateService(svc.id, 'envVars', e.target.value)} />
          </div>

          <div>
            <label className={labelCls} style={{ color: 'var(--color-text-secondary)' }}>Volumes (one per line)</label>
            <textarea className={`${inputCls} h-16`} placeholder="./data:/app/data" value={svc.volumes} onChange={(e) => updateService(svc.id, 'volumes', e.target.value)} />
          </div>
        </div>
      ))}

      <div className="flex gap-2">
        <button onClick={addService} className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors">
          + Add Service
        </button>
        <button onClick={generate} className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] transition-colors">
          Generate
        </button>
        {output && (
          <>
            <button onClick={copyToClipboard} className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors">
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button onClick={download} className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors">
              Download
            </button>
          </>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-[var(--color-error)]/10 px-3 py-2 text-sm text-[var(--color-error)]">
          {error}
        </div>
      )}

      {output && (
        <pre className="w-full min-h-[12rem] max-h-96 overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 font-mono text-sm text-[var(--color-text)]">
          {output}
        </pre>
      )}
    </div>
  )
}
