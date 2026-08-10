import { useRef, useState, type ReactNode } from 'react'

interface Props {
  accept?: string
  multiple?: boolean
  onFiles: (files: File[]) => void
  children?: ReactNode
  hint?: string
}

export default function FileDropzone({ accept, multiple, onFiles, children, hint }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const push = (list: FileList | null) => {
    if (!list || list.length === 0) return
    onFiles(Array.from(list))
  }

  return (
    <div
      onClick={() => input.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); push(e.dataTransfer.files) }}
      className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition ${
        dragging
          ? 'border-[var(--color-primary)] bg-[var(--color-bg-secondary)]'
          : 'border-[var(--color-border)] hover:border-[var(--color-primary)]'
      }`}
    >
      <input
        ref={input}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          push(e.target.files)
          if (input.current) input.current.value = ''
        }}
      />
      {children ?? (
        <p className="text-sm text-[var(--color-text-secondary)]">
          {hint ?? 'Click or drop audio files here'}
        </p>
      )}
    </div>
  )
}
