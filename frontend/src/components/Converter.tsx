import { useState, useRef } from 'react'
import '../styles/converter.css'

type FileObject = {
  fileName: string
  fileSize: number
  mimeType: string
}

export default function Converter() {
  const [progress, setProgress] = useState(0)
  const [format, setFormat] = useState('mp4')
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  function addFiles(selected: FileList | null) {
    if (!selected) return
    const list = Array.from(selected)
    const newFiles = [...files, ...list].slice(0, 5)
    if (newFiles.length > 5) {
      setError('Limit 5 files')
    } else {
      setError(null)
    }
    setFiles(newFiles)
    setProgress(0)
    setDownloadUrl(null)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    addFiles(e.dataTransfer?.files ?? null)
  }

  async function submit() {
    setError(null)
    if (files.length === 0) {
      setError('No files selected')
      return
    }
    if (files.length > 5) {
      setError('Maximum 5 files allowed')
      return
    }

    // build payload according to docs
    const payload = {
      targetFormat: format,
      files: files.map<FileObject>((f) => ({
        fileName: f.name,
        fileSize: f.size,
        mimeType: f.type || 'application/octet-stream',
      })),
    }

    try {
      setProgress(5)
      // POST JSON payload to /api/convert (server expected to fetch files separately or accept metadata)
      const res = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || res.statusText)
      }

      // server may return a binary file or a JSON with a download URL
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        const data = await res.json()
        if (data.downloadUrl) {
          setDownloadUrl(data.downloadUrl)
          setProgress(100)
        } else {
          setError('No download URL returned')
        }
      } else {
        // assume binary blob for the converted file
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        setDownloadUrl(url)
        setProgress(100)
      }
    } catch (err: any) {
      setError(err?.message || 'Upload failed')
      setProgress(0)
    }
  }

  return (
    <div className="converter-wrap">
      <header className="top-row">
        <div className="logo-box">LOGO.PNG</div>
        <div className="anim-box">ANIMATION.GIF</div>
      </header>

      <main className="panel">
        <label className="label">UPLOAD</label>
        <div
          className="drop"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          {files.length > 0
            ? files.map((f) => f.name).join(', ')
            : 'drop here'}
        </div>

        <label className="label">CONVERT TO</label>
        <div className="controls">
          <select value={format} onChange={(e) => setFormat(e.target.value)}>
            <optgroup label="Image">
              <option value="jpeg">jpeg</option>
              <option value="png">png</option>
              <option value="bmp">bmp</option>
            </optgroup>
            <optgroup label="Video">
              <option value="flv">flv</option>
              <option value="mov">mov</option>
              <option value="mp4">mp4</option>
              <option value="avi">avi</option>
            </optgroup>
            <optgroup label="Sound">
              <option value="wav">wav</option>
              <option value="mp3">mp3</option>
              <option value="ogg">ogg</option>
              <option value="midi">midi</option>
            </optgroup>
          </select>

          <button className="ok submit green" onClick={submit}>
            submit
          </button>

          <div className="progress-row">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <div className="progress-percent">{Math.min(progress, 100)}%</div>
          </div>

          {error && <div className="error">{error}</div>}

          <a
            className="download"
            href={downloadUrl ?? '#'}
            download
            onClick={(e) => {
              if (!downloadUrl) e.preventDefault()
            }}
            aria-disabled={!downloadUrl}
          >
            DOWNLOAD CONVERTED FILE
          </a>
        </div>

        <input
          ref={inputRef}
          className="hidden"
          type="file"
          multiple
          accept=".jpeg,.jpg,.png,.bmp,.flv,.mov,.mp4,.avi,.wav,.mp3,.ogg,.midi"
          onChange={(e) => addFiles(e.target.files)}
        />
      </main>

      <footer className="banner">BANER REKLAMOWY</footer>
    </div>
  )
}
