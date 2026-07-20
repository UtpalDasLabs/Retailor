import { useState } from 'react'
import { Resume } from '../schema/resume'
import { parseReply, ParseError, ParseResult } from '../parse/parseReply'
import { readFileText } from '../storage/local'

export function Step3Paste({
  reply,
  onReplyChange,
  base,
  onParsed,
  onGoStep2,
  onToast,
}: {
  reply: string
  onReplyChange: (v: string) => void
  base: Resume
  onParsed: (result: Extract<ParseResult, { ok: true }>) => void
  onGoStep2: () => void
  onToast: (msg: string) => void
}) {
  const [error, setError] = useState<ParseError | null>(null)
  const [drag, setDrag] = useState(false)

  const read = (text: string) => {
    const result = parseReply(text, base)
    if (result.ok) {
      setError(null)
      onParsed(result)
    } else {
      setError(result.error)
    }
  }

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    const text = await readFileText(file)
    onReplyChange(text)
    read(text)
  }

  return (
    <div className="step">
      <h1 className="step-title">Step 3 — Paste the reply</h1>
      <p className="step-lead">Paste the AI’s whole answer below, then read it.</p>

      <div
        className={'drop' + (drag ? ' drag' : '')}
        onDragOver={(e) => {
          e.preventDefault()
          setDrag(true)
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDrag(false)
          handleFile(e.dataTransfer.files?.[0])
        }}
      >
        <textarea
          className="reply-textarea"
          value={reply}
          placeholder="Paste the AI’s reply here…"
          onChange={(e) => onReplyChange(e.target.value)}
        />
      </div>

      <div className="step-actions">
        <button
          type="button"
          className="btn btn-primary btn-lg"
          disabled={!reply.trim()}
          onClick={() => read(reply)}
        >
          Read the reply
        </button>
        <label className="btn">
          Or choose a file (.md/.txt)
          <input
            type="file"
            accept=".md,.markdown,.txt,text/markdown,text/plain"
            className="visually-hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </label>
      </div>

      {error && (
        <div className="parse-error" role="alert">
          <h2>{error.title}</h2>
          <p>{error.body}</p>
          {error.action === 'go-step-2' ? (
            <button type="button" className="btn btn-primary" onClick={onGoStep2}>
              Take me to step 2
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(error.fixItText ?? '')
                  onToast('Copied — paste that to your AI, then paste its new reply here.')
                } catch {
                  onToast(error.fixItText ?? '')
                }
              }}
            >
              Copy the fix-it message
            </button>
          )}
        </div>
      )}
    </div>
  )
}
