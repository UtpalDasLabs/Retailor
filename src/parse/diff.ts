import { Resume } from '../schema/resume'

// A single reviewable change between the current CV (before) and the proposed
// CV (after). Each change carries the JSON path + raw value so the review UI
// can toggle it on/off and apply only the accepted ones onto the base.

export interface Change {
  id: string
  section: string // display group, e.g. "Summary", "Work — Lumen Health"
  label: string // short sub-label, e.g. a field name
  path: (string | number)[]
  kind: 'changed' | 'added'
  before: string // human-readable
  after: string // human-readable
  afterValue: unknown // raw value to write when accepted
  flagged?: boolean // draw extra attention (e.g. the person was renamed)
}

function isEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
}

function isEmpty(v: unknown): boolean {
  if (v === undefined || v === null) return true
  if (typeof v === 'string') return v.trim() === ''
  if (Array.isArray(v)) return v.length === 0
  return false
}

function get(obj: unknown, path: (string | number)[]): unknown {
  let cur: unknown = obj
  for (const k of path) {
    if (cur === null || typeof cur !== 'object') return undefined
    cur = (cur as Record<string | number, unknown>)[k]
  }
  return cur
}

// ---------- human-readable formatting ----------

function line(...parts: (string | undefined)[]): string {
  return parts.filter((p) => p && String(p).trim()).join(' · ')
}

function fmtStringList(v: unknown): string {
  if (!Array.isArray(v)) return String(v ?? '')
  return v.map((s) => `• ${String(s)}`).join('\n')
}

function fmtWorkItem(w: unknown): string {
  if (w === null || typeof w !== 'object') return String(w ?? '')
  const o = w as Record<string, unknown>
  const header = line(
    o.position as string,
    o.name as string,
    line(o.startDate as string, o.endDate as string),
  )
  const hi = Array.isArray(o.highlights)
    ? o.highlights.map((h) => `• ${String(h)}`).join('\n')
    : ''
  return [header, hi].filter(Boolean).join('\n')
}

function fmtObjectList(v: unknown, fields: string[]): string {
  if (!Array.isArray(v)) return String(v ?? '')
  return v
    .map((item) => {
      if (item === null || typeof item !== 'object') return String(item ?? '')
      const o = item as Record<string, unknown>
      return '• ' + line(...fields.map((f) => o[f] as string))
    })
    .join('\n')
}

// ---------- section descriptors ----------

interface Section {
  path: (string | number)[]
  section: string
  label: string
  format: (v: unknown) => string
}

const strList = (v: unknown) => fmtStringList(v)
const scalar = (v: unknown) => String(v ?? '')

function objList(fields: string[]) {
  return (v: unknown) => fmtObjectList(v, fields)
}

function topSections(): Section[] {
  return [
    { path: ['basics', 'label'], section: 'Role title', label: 'Headline', format: scalar },
    { path: ['basics', 'summary'], section: 'Summary', label: 'Summary paragraphs', format: strList },
    { path: ['basics', 'x_highlights'], section: 'Highlights', label: 'Highlights', format: strList },
    { path: ['x_coreCompetence'], section: 'Core competence', label: 'Skills', format: strList },
    { path: ['x_portfolio'], section: 'Product portfolio', label: 'Portfolio', format: strList },
    {
      path: ['x_advisory'],
      section: 'Advisory',
      label: 'Advisory roles',
      format: objList(['role', 'organization', 'startDate', 'endDate']),
    },
    {
      path: ['languages'],
      section: 'Languages',
      label: 'Languages',
      format: objList(['language', 'fluency']),
    },
    {
      path: ['education'],
      section: 'Education',
      label: 'Education',
      format: objList(['studyType', 'area', 'institution', 'startDate', 'endDate']),
    },
    {
      path: ['certificates'],
      section: 'Certifications',
      label: 'Certifications',
      format: objList(['name', 'issuer', 'date']),
    },
    {
      path: ['awards'],
      section: 'Kudos received',
      label: 'Awards',
      format: objList(['title', 'awarder']),
    },
    {
      path: ['x_memberships'],
      section: 'Active membership',
      label: 'Memberships',
      format: objList(['organization', 'since']),
    },
  ]
}

/**
 * Compute the reviewable changes between a base CV and a proposed CV.
 * A rename of the candidate is surfaced as a prominently flagged change.
 */
export function diffResumes(base: Resume, proposed: Resume): Change[] {
  const changes: Change[] = []

  // Name change — flagged.
  const beforeName = get(base, ['basics', 'name'])
  const afterName = get(proposed, ['basics', 'name'])
  if (!isEqual(beforeName, afterName) && !isEmpty(afterName)) {
    changes.push({
      id: 'basics.name',
      section: 'Name',
      label: 'Full name',
      path: ['basics', 'name'],
      kind: isEmpty(beforeName) ? 'added' : 'changed',
      before: scalar(beforeName),
      after: scalar(afterName),
      afterValue: afterName,
      flagged: !isEmpty(beforeName),
    })
  }

  for (const s of topSections()) {
    const before = get(base, s.path)
    const after = get(proposed, s.path)
    if (isEqual(before, after)) continue
    if (isEmpty(after) && isEmpty(before)) continue
    changes.push({
      id: s.path.join('.'),
      section: s.section,
      label: s.label,
      path: s.path,
      kind: isEmpty(before) ? 'added' : 'changed',
      before: s.format(before),
      after: s.format(after),
      afterValue: after,
    })
  }

  // Work items — one change per position, matched by index.
  const baseWork = (get(base, ['work']) as unknown[]) ?? []
  const propWork = (get(proposed, ['work']) as unknown[]) ?? []
  const n = Math.max(baseWork.length, propWork.length)
  for (let i = 0; i < n; i++) {
    const before = baseWork[i]
    const after = propWork[i]
    if (isEqual(before, after)) continue
    if (after === undefined) continue // removals via merge don't happen; skip
    const title =
      (after as Record<string, unknown> | undefined)?.name ??
      (after as Record<string, unknown> | undefined)?.position ??
      `Position ${i + 1}`
    changes.push({
      id: `work.${i}`,
      section: `Work — ${String(title)}`,
      label: 'Role, dates & bullet points',
      path: ['work', i],
      kind: before === undefined ? 'added' : 'changed',
      before: fmtWorkItem(before),
      after: fmtWorkItem(after),
      afterValue: after,
    })
  }

  return changes
}

function setPath(obj: Record<string, unknown>, path: (string | number)[], value: unknown): void {
  let cur: Record<string | number, unknown> = obj
  for (let i = 0; i < path.length - 1; i++) {
    const k = path[i]
    const next = cur[k]
    if (next === null || typeof next !== 'object') {
      cur[k] = typeof path[i + 1] === 'number' ? [] : {}
    }
    cur = cur[k] as Record<string | number, unknown>
  }
  cur[path[path.length - 1]] = value
}

/**
 * Start from the base CV and write only the accepted changes. This is what the
 * Review screen renders and downloads as the user toggles changes on and off.
 */
export function applyChanges(
  base: Resume,
  changes: Change[],
  acceptedIds: ReadonlySet<string>,
): Resume {
  const out = structuredClone(base) as Record<string, unknown>
  for (const c of changes) {
    if (acceptedIds.has(c.id)) setPath(out, c.path, structuredClone(c.afterValue))
  }
  return out as Resume
}

/** Default selection: keep everything except flagged changes (e.g. a rename). */
export function defaultAcceptedIds(changes: Change[]): Set<string> {
  return new Set(changes.filter((c) => !c.flagged).map((c) => c.id))
}
