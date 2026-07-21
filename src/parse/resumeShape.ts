import { Resume } from '../schema/resume'

// Fields that must be arrays of strings for the template to iterate them.
const STRING_LIST_PATHS: string[][] = [
  ['basics', 'summary'],
  ['basics', 'x_highlights'],
  ['x_coreCompetence'],
  ['x_portfolio'],
]

// Top-level fields that must be arrays of objects.
const OBJECT_LIST_KEYS = [
  'work',
  'education',
  'certificates',
  'awards',
  'languages',
  'skills',
  'x_advisory',
  'x_memberships',
] as const

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

/** True if this object plausibly IS a resume (has basics or a work array). */
export function looksLikeResume(value: unknown): boolean {
  if (!isPlainObject(value)) return false
  if (isPlainObject(value.basics)) return true
  if (Array.isArray(value.work)) return true
  // A bare basics-like object (name + one more common field) also counts.
  const hasName = typeof value.name === 'string'
  const hasResumeish =
    'label' in value || 'summary' in value || 'education' in value || 'skills' in value
  return hasName && hasResumeish
}

function wrapScalarList(v: unknown): unknown {
  if (Array.isArray(v)) return v
  if (typeof v === 'string') return v.trim() ? [v] : []
  if (v === null || v === undefined) return v
  return [v]
}

function getIn(obj: Record<string, unknown>, path: string[]): unknown {
  let cur: unknown = obj
  for (const k of path) {
    if (!isPlainObject(cur)) return undefined
    cur = cur[k]
  }
  return cur
}

function setIn(obj: Record<string, unknown>, path: string[], value: unknown): void {
  let cur: Record<string, unknown> = obj
  for (let i = 0; i < path.length - 1; i++) {
    const k = path[i]
    if (!isPlainObject(cur[k])) cur[k] = {}
    cur = cur[k] as Record<string, unknown>
  }
  cur[path[path.length - 1]] = value
}

/**
 * Best-effort repair of an LLM-produced resume so the renderer never crashes:
 * list fields that arrived as a bare scalar are wrapped into arrays, and
 * object-list fields that arrived as a single object are wrapped too.
 */
export function coerceResumeShape(resume: Resume): Resume {
  const r = structuredClone(resume) as Record<string, unknown>

  for (const path of STRING_LIST_PATHS) {
    const cur = getIn(r, path)
    if (cur !== undefined) setIn(r, path, wrapScalarList(cur))
  }

  for (const key of OBJECT_LIST_KEYS) {
    const cur = r[key]
    if (cur !== undefined && !Array.isArray(cur)) {
      r[key] = isPlainObject(cur) ? [cur] : []
    }
  }

  // Per-work highlights must be string arrays too.
  if (Array.isArray(r.work)) {
    r.work = (r.work as unknown[]).map((w) => {
      if (isPlainObject(w) && 'highlights' in w) {
        return { ...w, highlights: wrapScalarList(w.highlights) }
      }
      return w
    })
  }

  return r as Resume
}
