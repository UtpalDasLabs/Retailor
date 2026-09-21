import { useMemo, useState } from 'react'
import { Resume } from '../schema/resume'
import { Change, applyChanges } from '../parse/diff'
import { PdfPreview } from '../preview/PdfPreview'
import { usePdfBlob } from '../preview/usePdfBlob'
import { pdfFileName } from '../pdf/renderPdf'
import { exportResumeJson, savePdf } from '../storage/local'
import { ValueEditor } from './ValueEditor'

// AI drafts often leave blanks to fill in ("[CONFIRM team size]"), so the
// suggested side of every change is editable before you preview or download.
const PLACEHOLDER_RE = /\[[^\]]*(confirm|tbd|x%|add|your)[^\]]*\]/i

function ChangeCard({
  change,
  accepted,
  onToggle,
  onEdit,
}: {
  change: Change
  accepted: boolean
  onToggle: () => void
  onEdit: (value: unknown) => void
}) {
  const [editing, setEditing] = useState(false)
  const needsInput = PLACEHOLDER_RE.test(change.after)
  const workLabels = change.id.startsWith('work.') ? { name: 'Company' } : undefined

  return (
    <div className={'change' + (accepted ? '' : ' off') + (change.flagged ? ' flagged' : '')}>
      <div className="change-head">
        <label className="change-head-main">
          <input type="checkbox" checked={accepted} onChange={onToggle} />
          <span className="change-section">
            {change.flagged ? '⚠ ' : ''}
            {change.section}
          </span>
        </label>
        {needsInput && !editing && <span className="change-todo">needs your input</span>}
        <span className={'change-kind ' + change.kind}>{change.kind}</span>
        <button type="button" className="btn btn-sm" onClick={() => setEditing((v) => !v)}>
          {editing ? 'Done' : 'Edit'}
        </button>
      </div>
      {change.flagged && (
        <p className="change-warn">
          This changes your name. Leave it off unless you’re sure.
        </p>
      )}
      <div className="change-diff">
        {change.before.trim() ? (
          <div className="diff-col before">
            <span className="diff-tag">Now</span>
            <pre>{change.before}</pre>
          </div>
        ) : null}
        <div className="diff-col after">
          <span className="diff-tag">{editing ? 'Your version' : 'Suggested'}</span>
          {editing ? (
            <ValueEditor
              value={change.afterValue}
              overrides={workLabels}
              onChange={(next) => onEdit(next)}
            />
          ) : (
            <pre>{change.after}</pre>
          )}
        </div>
      </div>
    </div>
  )
}


export function Step4Review({
  base,
  changes,
  warnings,
  accepted,
  setAccepted,
  onEditChange,
  onAnotherJob,
  onCommitToCv,
  onToast,
}: {
  base: Resume
  changes: Change[]
  warnings: string[]
  accepted: Set<string>
  setAccepted: (s: Set<string>) => void
  onEditChange: (id: string, value: unknown) => void
  onAnotherJob: () => void
  onCommitToCv: (applied: Resume) => void
  onToast: (msg: string) => void
}) {
  const [tab, setTab] = useState<'changes' | 'preview'>('changes')

  const applied = useMemo(
    () => applyChanges(base, changes, accepted),
    [base, changes, accepted],
  )
  const { blob, loading, error } = usePdfBlob(applied)

  const toggle = (id: string) => {
    const next = new Set(accepted)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setAccepted(next)
  }
  const keepAll = () => setAccepted(new Set(changes.map((c) => c.id)))
  const undoAll = () => setAccepted(new Set())

  return (
    <div className="step">
      <h1 className="step-title">Step 4 — Review &amp; download</h1>
      <p className="reminder">
        Check the changes — AIs sometimes exaggerate. You are responsible for what your CV claims.
      </p>

      <div className="tabs" role="tablist">
        <button
          role="tab"
          aria-selected={tab === 'changes'}
          className={'tab' + (tab === 'changes' ? ' active' : '')}
          onClick={() => setTab('changes')}
        >
          Changes{changes.length ? ` (${changes.length})` : ''}
        </button>
        <button
          role="tab"
          aria-selected={tab === 'preview'}
          className={'tab' + (tab === 'preview' ? ' active' : '')}
          onClick={() => setTab('preview')}
        >
          Preview
        </button>
      </div>

      {tab === 'changes' ? (
        <div className="changes-pane">
          {warnings.length > 0 && (
            <div className="warn-box">
              <strong>Heads up — a few things were adjusted:</strong>
              <ul>
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {changes.length === 0 ? (
            <p className="empty">
              The AI didn’t suggest any changes to your CV. You can still download it as a PDF from
              the Preview tab.
            </p>
          ) : (
            <>
              <div className="changes-actions">
                <button type="button" className="btn btn-sm" onClick={keepAll}>
                  Keep all
                </button>
                <button type="button" className="btn btn-sm" onClick={undoAll}>
                  Undo all
                </button>
                <span className="hint">{accepted.size} of {changes.length} kept</span>
              </div>
              {changes.map((c) => (
                <ChangeCard
                  key={c.id}
                  change={c}
                  accepted={accepted.has(c.id)}
                  onToggle={() => toggle(c.id)}
                  onEdit={(value) => {
                    // Editing a suggestion means you want it, so keep it on.
                    if (!accepted.has(c.id)) setAccepted(new Set([...accepted, c.id]))
                    onEditChange(c.id, value)
                  }}
                />
              ))}
            </>
          )}
        </div>
      ) : (
        <div className="preview-pane">
          {error ? (
            <div className="parse-error">Couldn’t build the PDF: {error}</div>
          ) : (
            <PdfPreview blob={blob} loading={loading} />
          )}
        </div>
      )}

      <div className="download-bar">
        <button
          type="button"
          className="btn btn-primary btn-lg"
          disabled={!blob}
          onClick={async () => {
            if (blob) {
              const ok = await savePdf(blob, pdfFileName(applied))
              if (ok) onToast('Saved your PDF.')
            }
          }}
        >
          {blob ? 'Download PDF' : 'Preparing PDF…'}
        </button>
        <button type="button" className="btn btn-lg" onClick={() => exportResumeJson(applied)}>
          Save this CV as a file (.json)
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => {
            onAnotherJob()
            onToast('Ready for the next job — your saved CV is unchanged.')
          }}
        >
          Tailor another job
        </button>
        {changes.length > 0 && (
          <button
            type="button"
            className="btn"
            title="Fold these accepted edits into your saved CV so future jobs start from them"
            onClick={() => {
              if (
                window.confirm(
                  'Fold these accepted edits into your saved CV? This changes your baseline — future jobs will be tailored from this version instead of your original.',
                )
              ) {
                onCommitToCv(applied)
              }
            }}
          >
            Keep these edits in my CV
          </button>
        )}
      </div>
      <p className="hint" style={{ marginTop: 10 }}>
        Downloading a PDF or saving a file never changes your saved CV. Use <strong>Tailor another
        job</strong> to start the next one from your original CV.
      </p>
    </div>
  )
}
