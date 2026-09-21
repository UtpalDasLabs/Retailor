import { Resume } from '../schema/resume'

// LLM replies often repeat themselves — the same bullet twice, or the same
// sentence with different punctuation. Those duplicates would land verbatim in
// the CV, so they're removed on import. Matching is exact-after-normalisation
// (case, punctuation and spacing are ignored); genuinely different wording is
// always kept, and the first occurrence wins so ordering is preserved.

/** Normalise a line for comparison only — the original text is what's kept. */
function normKey(s: string): string {
  return s
    .toLowerCase()
    .replace(/[‘’“”]/g, "'")
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

/** Identity of an object entry: its string fields, normalised and joined. */
function objectKey(o: Record<string, unknown>, fields?: string[]): string {
  const keys = fields ?? Object.keys(o).sort()
  return keys
    .map((k) => {
      const v = o[k]
      if (typeof v === 'string') return normKey(v)
      if (Array.isArray(v)) return v.map((x) => (typeof x === 'string' ? normKey(x) : '')).join(',')
      return ''
    })
    .join('|')
}

interface Counter {
  removed: number
}

function dedupeStringList(value: unknown, c: Counter): unknown {
  if (!Array.isArray(value)) return value
  const seen = new Set<string>()
  const out: unknown[] = []
  for (const item of value) {
    if (typeof item !== 'string') {
      out.push(item)
      continue
    }
    const key = normKey(item)
    if (key === '') {
      out.push(item)
      continue
    }
    if (seen.has(key)) {
      c.removed++
      continue
    }
    seen.add(key)
    out.push(item)
  }
  return out
}

function dedupeObjectList(value: unknown, c: Counter, fields?: string[]): unknown {
  if (!Array.isArray(value)) return value
  const seen = new Set<string>()
  const out: unknown[] = []
  for (const item of value) {
    if (!isPlainObject(item)) {
      out.push(item)
      continue
    }
    const key = objectKey(item, fields)
    if (key.replace(/\|/g, '').trim() === '') {
      out.push(item)
      continue
    }
    if (seen.has(key)) {
      c.removed++
      continue
    }
    seen.add(key)
    out.push(item)
  }
  return out
}

/**
 * Remove repeated entries an LLM produced. Returns the cleaned resume and how
 * many duplicates were dropped, so the UI can mention it.
 */
export function dedupeResume(resume: Resume): { resume: Resume; removed: number } {
  const c: Counter = { removed: 0 }
  const r = structuredClone(resume) as Record<string, unknown>

  const basics = isPlainObject(r.basics) ? r.basics : undefined
  if (basics) {
    basics.summary = dedupeStringList(basics.summary, c)
    basics.x_highlights = dedupeStringList(basics.x_highlights, c)
  }

  r.x_coreCompetence = dedupeStringList(r.x_coreCompetence, c)
  r.x_portfolio = dedupeStringList(r.x_portfolio, c)

  r.skills = dedupeObjectList(r.skills, c, ['name'])
  r.awards = dedupeObjectList(r.awards, c)
  r.certificates = dedupeObjectList(r.certificates, c)
  r.languages = dedupeObjectList(r.languages, c, ['language'])
  r.education = dedupeObjectList(r.education, c)
  r.x_advisory = dedupeObjectList(r.x_advisory, c)
  r.x_memberships = dedupeObjectList(r.x_memberships, c)

  // Work: drop duplicated positions, and duplicated bullets within a position.
  r.work = dedupeObjectList(r.work, c, ['position', 'name', 'startDate', 'endDate'])
  if (Array.isArray(r.work)) {
    r.work = (r.work as unknown[]).map((w) => {
      if (!isPlainObject(w) || !('highlights' in w)) return w
      return { ...w, highlights: dedupeStringList(w.highlights, c) }
    })
  }

  // Undefined fields must stay undefined rather than becoming undefined-valued
  // keys, so the merge/diff treat them as absent.
  for (const k of Object.keys(r)) if (r[k] === undefined) delete r[k]

  return { resume: r as Resume, removed: c.removed }
}
