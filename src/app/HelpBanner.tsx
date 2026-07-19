import { ReactNode, useState } from 'react'

/**
 * A dismissible, plain-English "how to use this" panel. Each banner remembers
 * (in localStorage) whether the user hid it, and can be reopened with a small
 * link — so first-timers get guidance and returning users aren't nagged.
 */
export function HelpBanner({
  id,
  title,
  steps,
}: {
  id: string
  title: string
  steps: ReactNode[]
}) {
  const key = 'retailor.help.' + id + '.hidden'
  const [hidden, setHidden] = useState(() => localStorage.getItem(key) === '1')

  if (hidden) {
    return (
      <button
        type="button"
        className="help-reopen"
        onClick={() => {
          localStorage.removeItem(key)
          setHidden(false)
        }}
      >
        Need help with this tab? Show the steps
      </button>
    )
  }

  return (
    <section className="help-banner" aria-label="How to use this tab">
      <div className="help-banner-head">
        <span className="help-badge">How to use this</span>
        <strong className="help-title">{title}</strong>
        <button
          type="button"
          className="help-close"
          onClick={() => {
            localStorage.setItem(key, '1')
            setHidden(true)
          }}
        >
          Hide ✕
        </button>
      </div>
      <ol className="help-steps">
        {steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
    </section>
  )
}
