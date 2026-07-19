import { useEffect, useRef, useState } from 'react'
import { Resume } from '../schema/resume'
import { getTemplate, templates } from '../templates/registry'
import { providers } from '../llm/provider'
import { setIn } from './setIn'

const PAGE_W_PX = (210 / 25.4) * 96 // 210mm at CSS 96dpi

export function PreviewView({
  resume,
  onChange,
}: {
  resume: Resume
  onChange: (r: Resume) => void
}) {
  const stageRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [showPrintHelp, setShowPrintHelp] = useState(false)
  const template = getTemplate(resume.meta?.template)
  const Component = template.component

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const update = () =>
      setScale(Math.min(1, (el.clientWidth - 2) / PAGE_W_PX))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div>
      <div className="pv-toolbar">
        <label className="field-label" htmlFor="tpl-select">
          Template
        </label>
        <select
          id="tpl-select"
          style={{ width: 'auto' }}
          value={template.id}
          onChange={(e) => onChange(setIn(resume, ['meta', 'template'], e.target.value))}
        >
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <label className="field-label" htmlFor="llm-select">
          AI tailoring
        </label>
        <select id="llm-select" style={{ width: 'auto' }} disabled title="Bring your own API key — coming soon">
          <option>Bring your own API key — coming soon</option>
          {providers.map((p) => (
            <option key={p.id} disabled>
              {p.label}
            </option>
          ))}
        </select>
        <div className="spacer" />
        <button type="button" className="btn btn-primary" onClick={() => setShowPrintHelp(true)}>
          Download PDF
        </button>
      </div>

      <div className="pv-stage" ref={stageRef}>
        <div
          className="pv-scale"
          style={{ '--pv-scale': scale, width: PAGE_W_PX } as React.CSSProperties}
        >
          <Component resume={resume} />
        </div>
      </div>

      {showPrintHelp ? (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="print-help-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPrintHelp(false)
          }}
        >
          <div className="modal">
            <h2 id="print-help-title">Save as PDF</h2>
            <p>
              Retailor uses your browser's print pipeline — the PDF is vector output with
              selectable text. In the print dialog choose:
            </p>
            <ol>
              <li>
                Destination: <kbd>Save as PDF</kbd>
              </li>
              <li>
                Paper size: <kbd>A4</kbd>, Margins: <kbd>None</kbd>
              </li>
              <li>
                Enable <kbd>Background graphics</kbd> (prints the sidebar color)
              </li>
            </ol>
            <div className="modal-actions">
              <button type="button" className="btn" onClick={() => setShowPrintHelp(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setShowPrintHelp(false)
                  setTimeout(() => window.print(), 60)
                }}
              >
                Open print dialog
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
