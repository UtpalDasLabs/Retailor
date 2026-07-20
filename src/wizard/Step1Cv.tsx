import { useRef, useState } from 'react'
import { Resume } from '../schema/resume'
import { CvForm } from '../form/CvForm'
import { MiniPreview } from './MiniPreview'
import { parseReply } from '../parse/parseReply'
import { buildStructuringPrompt } from '../prompt/buildStructuringPrompt'

export function hasContent(resume: Resume): boolean {
  return Boolean(resume.basics?.name?.trim() || (resume.work?.length ?? 0) > 0)
}

export function Step1Cv({
  resume,
  onChange,
  onLoadSample,
  onImportFile,
  onStartBlank,
  onToast,
  onContinue,
}: {
  resume: Resume
  onChange: (r: Resume) => void
  onLoadSample: () => void
  onImportFile: (file: File) => void
  onStartBlank: () => void
  onToast: (msg: string) => void
  onContinue: () => void
}) {
  const fileInput = useRef<HTMLInputElement>(null)
  const docInput = useRef<HTMLInputElement>(null)
  const [showForm, setShowForm] = useState(hasContent(resume))
  const [importing, setImporting] = useState(false)
  const [importErr, setImportErr] = useState<string | null>(null)
  const [filled, setFilled] = useState<string[] | null>(null)
  const [cvText, setCvText] = useState('')
  const [showAi, setShowAi] = useState(false)
  const [aiReply, setAiReply] = useState('')
  const [aiErr, setAiErr] = useState<string | null>(null)
  const ready = hasContent(resume)

  const handleDoc = async (file: File | undefined) => {
    if (!file) return
    setImporting(true)
    setImportErr(null)
    setFilled(null)
    try {
      const { extractText } = await import('../import/extractText')
      const { heuristicParse } = await import('../import/heuristicParse')
      const { text } = await extractText(file)
      if (!text.trim()) {
        setImportErr('I couldn’t read any text from that file. If it’s a scanned image, try a text-based PDF or fill the form in yourself.')
        return
      }
      const { resume: parsed, filled } = heuristicParse(text)
      setCvText(text)
      onChange(parsed)
      setFilled(filled)
      setShowForm(true)
      setShowAi(false)
      setAiReply('')
      onToast('Imported what I could read. Check the details below.')
    } catch (e) {
      setImportErr('Sorry — I couldn’t read that file: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setImporting(false)
    }
  }

  const useAiVersion = () => {
    const res = parseReply(aiReply, resume)
    if (res.ok) {
      onChange(res.proposed)
      setAiErr(null)
      setShowAi(false)
      setAiReply('')
      onToast('Applied the AI’s structured version. Review it below.')
    } else {
      setAiErr(res.error.title + ' — ' + res.error.body)
    }
  }

  return (
    <div className="step">
      <h1 className="step-title">Step 1 — Your CV</h1>
      <p className="step-lead">
        Start from the example, import an existing CV (PDF, Word, or a saved Retailor file), or type
        it in. Your CV lives only in this browser. Nothing is uploaded.
      </p>

      <div className="cards">
        <button
          type="button"
          className="opt-card"
          onClick={() => {
            onLoadSample()
            setShowForm(true)
          }}
        >
          <span className="opt-emoji" aria-hidden>✨</span>
          <span className="opt-h">Start with the example CV</span>
          <span className="opt-d">See how it works with a ready-made sample, then edit it.</span>
        </button>

        <button type="button" className="opt-card" onClick={() => docInput.current?.click()}>
          <span className="opt-emoji" aria-hidden>📄</span>
          <span className="opt-h">Import from PDF or Word</span>
          <span className="opt-d">Upload an existing CV and I’ll read it into the form.</span>
        </button>
        <input
          ref={docInput}
          type="file"
          accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          className="visually-hidden"
          onChange={(e) => {
            handleDoc(e.target.files?.[0])
            e.target.value = ''
          }}
        />

        <button type="button" className="opt-card" onClick={() => fileInput.current?.click()}>
          <span className="opt-emoji" aria-hidden>📂</span>
          <span className="opt-h">Import a saved file (.json)</span>
          <span className="opt-d">Load a CV you exported from Retailor before.</span>
        </button>
        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          className="visually-hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) {
              onImportFile(f)
              setShowForm(true)
            }
            e.target.value = ''
          }}
        />

        <button
          type="button"
          className="opt-card"
          onClick={() => {
            if (!ready) onStartBlank()
            setShowForm(true)
          }}
        >
          <span className="opt-emoji" aria-hidden>✏️</span>
          <span className="opt-h">Fill it in myself</span>
          <span className="opt-d">Type your details into a simple form.</span>
        </button>
      </div>

      {importing && <p className="hint" style={{ marginTop: 14 }}>Reading your file…</p>}
      {importErr && (
        <div className="parse-error" style={{ marginTop: 14 }}>
          <p style={{ margin: 0 }}>{importErr}</p>
        </div>
      )}

      {filled && (
        <div className="import-note">
          <strong>Imported from your file.</strong>{' '}
          {filled.length
            ? `I filled in: ${filled.join(', ')}. `
            : 'I couldn’t confidently pull out fields. '}
          Reading work history from a PDF is imperfect — check everything below, or get a cleaner
          result with your AI.
          <div style={{ marginTop: 10 }}>
            <button type="button" className="btn btn-sm" onClick={() => setShowAi((v) => !v)}>
              {showAi ? 'Hide AI option' : 'Get a cleaner result with AI'}
            </button>
          </div>
        </div>
      )}

      {showAi && (
        <div className="ai-panel">
          <p>
            <strong>1.</strong> Copy this and paste it into any AI chatbot:
          </p>
          <div className="ai-actions">
            <button
              type="button"
              className="btn btn-sm"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(buildStructuringPrompt(cvText))
                  onToast('Copied. Paste it into your AI, then paste its reply back here.')
                } catch {
                  onToast('Couldn’t copy — open “See the text” and copy it manually.')
                }
              }}
            >
              Copy the structuring prompt
            </button>
            <details className="prompt-peek" style={{ flex: 1 }}>
              <summary>See the text</summary>
              <pre className="prompt-text">{buildStructuringPrompt(cvText)}</pre>
            </details>
          </div>
          <p style={{ marginTop: 12 }}>
            <strong>2.</strong> Paste the AI’s reply here:
          </p>
          <textarea
            className="jobad-textarea"
            value={aiReply}
            placeholder="Paste the AI’s reply (it should contain a JSON block)…"
            onChange={(e) => setAiReply(e.target.value)}
          />
          {aiErr && <p className="hint" style={{ color: 'var(--danger)' }}>{aiErr}</p>}
          <button
            type="button"
            className="btn btn-primary"
            disabled={!aiReply.trim()}
            onClick={useAiVersion}
          >
            Use the AI’s version
          </button>
        </div>
      )}

      {ready && (
        <div className="step1-ready">
          <div className="step1-thumb">
            <MiniPreview resume={resume} />
            <p className="hint">A quick preview. The polished PDF comes in step 4.</p>
          </div>
          <div className="step1-actions">
            <button type="button" className="btn btn-primary btn-lg" onClick={onContinue}>
              Continue →
            </button>
            <button type="button" className="btn" onClick={() => setShowForm((v) => !v)}>
              {showForm ? 'Hide details' : 'Edit my details'}
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="step1-form">
          <CvForm resume={resume} onChange={onChange} onToast={onToast} />
          {ready && (
            <div className="step1-actions">
              <button type="button" className="btn btn-primary btn-lg" onClick={onContinue}>
                Continue →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
