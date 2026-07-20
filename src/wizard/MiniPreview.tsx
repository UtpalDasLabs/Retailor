import { Resume } from '../schema/resume'

// A lightweight, instant HTML impression of the berlin-blue layout — used as a
// thumbnail in Step 1. The real, pixel-faithful render is the PDF in Step 4.

export function MiniPreview({ resume }: { resume: Resume }) {
  const b = resume.basics ?? {}
  const initials =
    (b.name ?? '')
      .split(/\s+/)
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('') || '?'
  const competences = (resume.x_coreCompetence ?? []).slice(0, 5)
  const firstJob = (resume.work ?? [])[0]

  return (
    <div className="mini" aria-label="CV thumbnail">
      <div className="mini-side">
        <div className="mini-photo">
          {b.picture ? <img src={b.picture} alt="" /> : <span>{initials}</span>}
        </div>
        <div className="mini-side-h">About</div>
        {b.email ? <div className="mini-side-line" /> : null}
        {b.phone ? <div className="mini-side-line short" /> : null}
        {competences.length > 0 && <div className="mini-side-h">Skills</div>}
        {competences.map((_, i) => (
          <div className="mini-side-line" key={i} />
        ))}
      </div>
      <div className="mini-main">
        <div className="mini-name">{b.name || 'Your Name'}</div>
        <div className="mini-rule" />
        {b.label ? <div className="mini-role">{b.label}</div> : null}
        <div className="mini-h">Summary</div>
        {(b.summary ?? ['', '']).slice(0, 3).map((_, i) => (
          <div className="mini-line" key={i} />
        ))}
        {firstJob && <div className="mini-h">Experience</div>}
        {firstJob && <div className="mini-line strong" />}
        {firstJob && <div className="mini-line" />}
        {firstJob && <div className="mini-line" />}
      </div>
    </div>
  )
}
