import { useState } from 'react'
import { Resume } from '../schema/resume'
import { CvEdits } from '../schema/edits'
import {
  AppliedEdit,
  applyEdits,
  getAtPointer,
  parseCvEditsMarkdown,
} from '../edits/apply'
import { readFileText } from '../storage/local'
import exampleFeedback from '../data/example-feedback.md?raw'
import { HelpBanner } from './HelpBanner'

function show(value: unknown): string {
  if (value === undefined) return '—'
  if (typeof value === 'string') return value
  return JSON.stringify(value, null, 1)
}

export function ImportView({
  resume,
  onApply,
  onToast,
}: {
  resume: Resume
  onApply: (r: Resume) => void
  onToast: (msg: string) => void
}) {
  const [text, setText] = useState('')
  const [drag, setDrag] = useState(false)
  const [errors, setErrors] = useState<string[] | null>(null)
  const [block, setBlock] = useState<CvEdits | null>(null)
  const [accepted, setAccepted] = useState<boolean[]>([])
  const [outcome, setOutcome] = useState<AppliedEdit[] | null>(null)

  const parse = (md: string) => {
    setOutcome(null)
    const result = parseCvEditsMarkdown(md)
    if (result.ok) {
      setBlock(result.block)
      setAccepted(result.block.edits.map(() => true))
      setErrors(null)
    } else {
      setBlock(null)
      setErrors(result.errors)
    }
  }

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    const md = await readFileText(file)
    setText(md)
    parse(md)
  }

  const apply = () => {
    if (!block) return
    const chosen = block.edits.filter((_, i) => accepted[i])
    if (chosen.length === 0) {
      onToast('No edits accepted.')
      return
    }
    const { resume: next, results } = applyEdits(resume, chosen)
    onApply(next)
    setOutcome(results)
    const failed = results.filter((r) => !r.ok).length
    onToast(
      failed
        ? `Applied ${results.length - failed} edit(s); ${failed} failed (see below).`
        : `Applied ${results.length} edit(s). Check the Preview tab.`,
    )
  }

  return (
    <div>
      <HelpBanner
        id="import"
        title="Let any AI tailor your CV for a specific job"
        steps={[
          <>
            Click <strong>Export JSON</strong> (top-right) to download your CV file.
          </>,
          <>
            Open any AI chat (ChatGPT, Claude, Gemini…). Paste your CV file, the job
            description, and the <strong>Prompt Pack</strong> from the README. Ask it to
            tailor your CV.
          </>,
          <>
            Copy the AI's reply (or save it as a <code>.md</code> file). Paste it into the
            box below, or drop the file on it.
          </>,
          <>
            Click <strong>Find &amp; review edits</strong>, tick the changes you want, then
            <strong> Apply</strong>. Open the <strong>Preview</strong> tab to see the result.
          </>,
          <>
            New here? Click <strong>Try the bundled example</strong> below to see exactly how
            this works.
          </>,
        ]}
      />
      <div
        className={'imp-drop' + (drag ? ' drag' : '')}
        onDragOver={(e) => {
          e.preventDefault()
          setDrag(true)
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDrag(false)
          handleFiles(e.dataTransfer.files)
        }}
      >
        <p>
          <strong>Drop a Markdown file</strong> from any LLM session here
        </p>
        <p className="hint">
          The file must end with a <code>```cv-edits</code> fenced block — see the Prompt
          Pack in the README. Everything is parsed locally.
        </p>
        <p>
          <label className="btn btn-sm" style={{ cursor: 'pointer' }}>
            Choose file
            <input
              type="file"
              accept=".md,.markdown,.txt,text/markdown,text/plain"
              className="visually-hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </label>
        </p>
      </div>

      <label className="field-label" htmlFor="md-paste">
        …or paste the LLM reply / Markdown here
      </label>
      <textarea
        id="md-paste"
        className="imp-textarea"
        value={text}
        placeholder={'Paste Markdown containing a ```cv-edits block…'}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="imp-actions">
        <button type="button" className="btn btn-primary" onClick={() => parse(text)}>
          Find &amp; review edits
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => {
            setText(exampleFeedback)
            parse(exampleFeedback)
          }}
        >
          Try the bundled example
        </button>
      </div>

      {errors ? (
        <div className="err-box" role="alert">
          <strong>Could not read the cv-edits block</strong>
          <ul>
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {block ? (
        <div>
          <div className="ok-box">
            <strong>Found {block.edits.length} proposed edit(s)</strong>
            {block.targetRole ? <div>Target role: {block.targetRole}</div> : null}
            {block.rationale ? <div>Strategy: {block.rationale}</div> : null}
          </div>

          <div className="imp-actions">
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setAccepted(block.edits.map(() => true))}
            >
              Accept all
            </button>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setAccepted(block.edits.map(() => false))}
            >
              Reject all
            </button>
            <button type="button" className="btn btn-primary" onClick={apply}>
              Apply {accepted.filter(Boolean).length} accepted edit(s)
            </button>
          </div>

          {block.edits.map((edit, i) => {
            const before =
              edit.op === 'move'
                ? getAtPointer(resume, edit.from)
                : edit.op === 'insert'
                  ? undefined
                  : getAtPointer(resume, edit.path)
            const after = 'value' in edit ? edit.value : undefined
            return (
              <div className={'edit-card' + (accepted[i] ? '' : ' rejected')} key={i}>
                <div>
                  <input
                    type="checkbox"
                    aria-label={`Accept edit ${i + 1}`}
                    checked={accepted[i] ?? false}
                    onChange={(e) => {
                      const next = [...accepted]
                      next[i] = e.target.checked
                      setAccepted(next)
                    }}
                  />
                </div>
                <div className="edit-meta">
                  <div>
                    <span className="edit-op">{edit.op}</span>
                    <span className="edit-path">
                      {edit.op === 'move' ? `${edit.from} → ${edit.path}` : edit.path}
                    </span>
                  </div>
                  {edit.why ? <div className="edit-why">{edit.why}</div> : null}
                  <div className="diff">
                    {edit.op === 'remove' ? (
                      <div className="diff-before">− {show(before)}</div>
                    ) : edit.op === 'move' ? (
                      <div className="diff-after">↷ {show(before)}</div>
                    ) : edit.op === 'insert' ? (
                      <div className="diff-after">+ {show(after)}</div>
                    ) : (
                      <>
                        <div className="diff-before">− {show(before)}</div>
                        <div className="diff-after">+ {show(after)}</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : null}

      {outcome ? (
        <div>
          <h3 style={{ margin: '18px 0 10px' }}>Result</h3>
          {outcome.map((r, i) => (
            <div className={'edit-card' + (r.ok ? '' : ' failed')} key={i}>
              <div className="edit-meta">
                <div>
                  <span className="edit-op">{r.ok ? 'applied' : 'failed'}</span>
                  <span className="edit-path">
                    {r.edit.op} {r.edit.op === 'move' ? `${r.edit.from} → ` : ''}
                    {r.edit.path}
                  </span>
                </div>
                {r.error ? <div className="edit-error">{r.error}</div> : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
