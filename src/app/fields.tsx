import { ReactNode, useId } from 'react'

export function TextField({
  label,
  value,
  onChange,
  textarea,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  textarea?: boolean
  placeholder?: string
}) {
  const id = useId()
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      {textarea ? (
        <textarea
          id={id}
          value={value}
          rows={2}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          id={id}
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  )
}

/** Editable list of strings with add/remove/reorder. */
export function StringListEditor({
  items,
  onChange,
  addLabel = 'Add item',
  rows = 2,
}: {
  items: string[]
  onChange: (items: string[]) => void
  addLabel?: string
  rows?: number
}) {
  const move = (i: number, dir: -1 | 1) => {
    const next = [...items]
    const j = i + dir
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }
  return (
    <div>
      {items.map((item, i) => (
        <div className="list-item" key={i}>
          <div className="grow">
            <textarea
              aria-label={`Item ${i + 1}`}
              value={item}
              rows={rows}
              style={{ width: '100%', boxSizing: 'border-box' }}
              onChange={(e) => {
                const next = [...items]
                next[i] = e.target.value
                onChange(next)
              }}
            />
          </div>
          <div className="list-item-tools">
            <button type="button" className="btn btn-sm" title="Move up" aria-label={`Move item ${i + 1} up`} onClick={() => move(i, -1)}>
              ↑
            </button>
            <button type="button" className="btn btn-sm" title="Move down" aria-label={`Move item ${i + 1} down`} onClick={() => move(i, 1)}>
              ↓
            </button>
            <button
              type="button"
              className="btn btn-sm btn-danger"
              title="Remove"
              aria-label={`Remove item ${i + 1}`}
              onClick={() => onChange(items.filter((_, j) => j !== i))}
            >
              ✕
            </button>
          </div>
        </div>
      ))}
      <button type="button" className="btn btn-sm" onClick={() => onChange([...items, ''])}>
        + {addLabel}
      </button>
    </div>
  )
}

/** Editable list of objects; simple text fields + optional custom body. */
export function ObjectListEditor<T extends Record<string, unknown>>({
  items,
  onChange,
  fields,
  makeNew,
  addLabel = 'Add entry',
  renderExtra,
}: {
  items: T[]
  onChange: (items: T[]) => void
  fields: { key: keyof T & string; label: string; textarea?: boolean }[]
  makeNew: () => T
  addLabel?: string
  renderExtra?: (item: T, update: (patch: Partial<T>) => void) => ReactNode
}) {
  const move = (i: number, dir: -1 | 1) => {
    const next = [...items]
    const j = i + dir
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }
  return (
    <div>
      {items.map((item, i) => (
        <div className="obj-item" key={i}>
          <div className="obj-item-head">
            <button type="button" className="btn btn-sm" title="Move up" aria-label={`Move entry ${i + 1} up`} onClick={() => move(i, -1)}>
              ↑
            </button>
            <button type="button" className="btn btn-sm" title="Move down" aria-label={`Move entry ${i + 1} down`} onClick={() => move(i, 1)}>
              ↓
            </button>
            <button
              type="button"
              className="btn btn-sm btn-danger"
              title="Remove entry"
              aria-label={`Remove entry ${i + 1}`}
              onClick={() => onChange(items.filter((_, j) => j !== i))}
            >
              ✕
            </button>
          </div>
          <div className="field-row">
            {fields.map((f) => (
              <TextField
                key={f.key}
                label={f.label}
                textarea={f.textarea}
                value={String(item[f.key] ?? '')}
                onChange={(v) => {
                  const next = [...items]
                  next[i] = { ...next[i], [f.key]: v }
                  onChange(next)
                }}
              />
            ))}
          </div>
          {renderExtra?.(item, (patch) => {
            const next = [...items]
            next[i] = { ...next[i], ...patch }
            onChange(next)
          })}
        </div>
      ))}
      <button type="button" className="btn btn-sm" onClick={() => onChange([...items, makeNew()])}>
        + {addLabel}
      </button>
    </div>
  )
}
