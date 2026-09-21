import { Fragment } from 'react'

// A small editor for whatever a change carries: a line of text, a list of
// lines, or a list of entries (a job, a qualification, a skill). It keeps any
// fields it doesn't know how to show, so nothing is lost by editing.

const LABELS: Record<string, string> = {
  position: 'Role title',
  name: 'Name',
  startDate: 'Start date',
  endDate: 'End date',
  summary: 'Summary',
  highlights: 'Bullet points (one per line)',
  keywords: 'Keywords (one per line)',
  institution: 'Institution',
  area: 'Field of study',
  studyType: 'Degree',
  issuer: 'Issuer',
  date: 'Year',
  title: 'Title',
  awarder: 'Awarded by',
  language: 'Language',
  fluency: 'Fluency',
  organization: 'Organization',
  since: 'Since',
  role: 'Role',
  level: 'Level',
  url: 'Link',
}

function labelFor(key: string, overrides?: Record<string, string>): string {
  return overrides?.[key] ?? LABELS[key] ?? key.replace(/^x_/, '').replace(/([A-Z])/g, ' $1')
}

function isStringList(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string')
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

const toLines = (v: string[]) => v.join('\n')
const fromLines = (v: string) =>
  v
    .split('\n')
    .map((l) => l.replace(/^\s*[•▪·-]\s*/, '').trim())
    .filter(Boolean)

function EntryEditor({
  entry,
  onChange,
  overrides,
}: {
  entry: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
  overrides?: Record<string, string>
}) {
  const set = (key: string, value: unknown) => onChange({ ...entry, [key]: value })
  return (
    <div className="edit-entry">
      {Object.keys(entry).map((key) => {
        const value = entry[key]
        if (typeof value === 'string') {
          const long = value.length > 60
          return (
            <label className="edit-field" key={key}>
              <span className="edit-label">{labelFor(key, overrides)}</span>
              {long ? (
                <textarea rows={3} value={value} onChange={(e) => set(key, e.target.value)} />
              ) : (
                <input type="text" value={value} onChange={(e) => set(key, e.target.value)} />
              )}
            </label>
          )
        }
        if (isStringList(value)) {
          return (
            <label className="edit-field" key={key}>
              <span className="edit-label">{labelFor(key, overrides)}</span>
              <textarea
                rows={Math.min(10, Math.max(3, value.length + 1))}
                value={toLines(value)}
                onChange={(e) => set(key, fromLines(e.target.value))}
              />
            </label>
          )
        }
        return <Fragment key={key} />
      })}
    </div>
  )
}

export function ValueEditor({
  value,
  onChange,
  overrides,
}: {
  value: unknown
  onChange: (next: unknown) => void
  overrides?: Record<string, string>
}) {
  // A single line of text (role title, name…)
  if (typeof value === 'string' || value === undefined || value === null) {
    const text = typeof value === 'string' ? value : ''
    return (
      <textarea
        className="edit-textarea"
        rows={Math.min(8, Math.max(2, Math.ceil(text.length / 60)))}
        value={text}
        onChange={(e) => onChange(e.target.value)}
      />
    )
  }

  // A list of lines (summary paragraphs, highlights, competences…)
  if (isStringList(value)) {
    return (
      <>
        <textarea
          className="edit-textarea"
          rows={Math.min(14, Math.max(3, value.length + 2))}
          value={toLines(value)}
          onChange={(e) => onChange(fromLines(e.target.value))}
        />
        <p className="hint">One per line.</p>
      </>
    )
  }

  // A single entry (one job)
  if (isPlainObject(value)) {
    return <EntryEditor entry={value} onChange={onChange} overrides={overrides} />
  }

  // A list of entries (skills, education, certificates…)
  if (Array.isArray(value)) {
    return (
      <>
        {value.map((item, i) =>
          isPlainObject(item) ? (
            <EntryEditor
              key={i}
              entry={item}
              overrides={overrides}
              onChange={(next) => {
                const copy = [...value]
                copy[i] = next
                onChange(copy)
              }}
            />
          ) : (
            <Fragment key={i} />
          ),
        )}
      </>
    )
  }

  return <p className="hint">This change can’t be edited here — keep or drop it instead.</p>
}
