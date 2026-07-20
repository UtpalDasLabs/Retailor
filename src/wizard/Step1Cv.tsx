import { useRef, useState } from 'react'
import { Resume } from '../schema/resume'
import { CvForm } from '../form/CvForm'
import { MiniPreview } from './MiniPreview'

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
  const [showForm, setShowForm] = useState(hasContent(resume))
  const ready = hasContent(resume)

  return (
    <div className="step">
      <h1 className="step-title">Step 1 — Your CV</h1>
      <p className="step-lead">
        Start from the example, load a CV file you saved before, or type it in. Your CV lives only
        in this browser. Nothing is uploaded.
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
          <span className="opt-emoji" aria-hidden>
            ✨
          </span>
          <span className="opt-h">Start with the example CV</span>
          <span className="opt-d">See how it works with a ready-made sample, then edit it.</span>
        </button>

        <button type="button" className="opt-card" onClick={() => fileInput.current?.click()}>
          <span className="opt-emoji" aria-hidden>
            📂
          </span>
          <span className="opt-h">Import my saved file (.json)</span>
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
          <span className="opt-emoji" aria-hidden>
            ✏️
          </span>
          <span className="opt-h">Fill it in myself</span>
          <span className="opt-d">Type your details into a simple form.</span>
        </button>
      </div>

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
