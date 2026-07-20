export const STEPS = [
  { n: 1, label: 'Your CV' },
  { n: 2, label: 'Ask your AI' },
  { n: 3, label: 'Paste the reply' },
  { n: 4, label: 'Review & download' },
] as const

export function Stepper({
  step,
  maxReached,
  onGo,
}: {
  step: number
  maxReached: number
  onGo: (n: number) => void
}) {
  return (
    <nav className="stepper" aria-label="Progress">
      <ol>
        {STEPS.map((s) => {
          const state = s.n === step ? 'current' : s.n < step ? 'done' : 'todo'
          const reachable = s.n <= maxReached
          return (
            <li key={s.n} className={`stepper-item ${state}`}>
              <button
                type="button"
                className="stepper-btn"
                aria-current={s.n === step ? 'step' : undefined}
                disabled={!reachable}
                onClick={() => reachable && onGo(s.n)}
              >
                <span className="stepper-num">{s.n < step ? '✓' : s.n}</span>
                <span className="stepper-label">{s.label}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
