import { CvEdits, CvEditsSchema, CvEdit } from '../schema/edits'
import { Resume } from '../schema/resume'

// ---------- Markdown parsing ----------

export type ParseResult =
  | { ok: true; block: CvEdits }
  | { ok: false; errors: string[] }

/**
 * Find the LAST ```cv-edits fenced block in a Markdown document,
 * parse its JSON and validate it. Returns friendly errors on failure.
 */
export function parseCvEditsMarkdown(markdown: string): ParseResult {
  const fenceRe = /```cv-edits[^\S\n]*\n([\s\S]*?)```/g
  let match: RegExpExecArray | null
  let last: string | null = null
  while ((match = fenceRe.exec(markdown)) !== null) last = match[1]
  if (last === null) {
    return {
      ok: false,
      errors: [
        'No ```cv-edits fenced code block found in this document.',
        'Make sure the LLM reply ends with a code block labeled cv-edits (see the Prompt Pack in the README).',
      ],
    }
  }
  let json: unknown
  try {
    json = JSON.parse(last)
  } catch (e) {
    return {
      ok: false,
      errors: [
        'The cv-edits block is not valid JSON: ' + (e instanceof Error ? e.message : String(e)),
      ],
    }
  }
  const result = CvEditsSchema.safeParse(json)
  if (!result.success) {
    return {
      ok: false,
      errors: result.error.issues.map(
        (i) => `${i.path.length ? i.path.join('.') : '(root)'}: ${i.message}`,
      ),
    }
  }
  return { ok: true, block: result.data }
}

// ---------- JSON Pointer ----------

export function parsePointer(pointer: string): string[] {
  if (pointer === '') return []
  if (!pointer.startsWith('/')) throw new Error(`invalid JSON Pointer: ${pointer}`)
  return pointer
    .slice(1)
    .split('/')
    .map((t) => t.replace(/~1/g, '/').replace(/~0/g, '~'))
}

/** Read the value at a pointer; returns undefined if the path doesn't resolve. */
export function getAtPointer(doc: unknown, pointer: string): unknown {
  let cur: unknown = doc
  for (const token of parsePointer(pointer)) {
    if (Array.isArray(cur)) {
      const idx = Number(token)
      if (!Number.isInteger(idx) || idx < 0 || idx >= cur.length) return undefined
      cur = cur[idx]
    } else if (cur !== null && typeof cur === 'object') {
      if (!(token in (cur as Record<string, unknown>))) return undefined
      cur = (cur as Record<string, unknown>)[token]
    } else {
      return undefined
    }
  }
  return cur
}

class EditError extends Error {}

/** Walk to the parent of the pointer target, creating nothing. Throws if missing. */
function resolveParent(doc: unknown, pointer: string): { parent: unknown; token: string } {
  const tokens = parsePointer(pointer)
  if (tokens.length === 0) throw new EditError('cannot edit the document root')
  let cur: unknown = doc
  for (let i = 0; i < tokens.length - 1; i++) {
    const token = tokens[i]
    if (Array.isArray(cur)) {
      const idx = Number(token)
      if (!Number.isInteger(idx) || idx < 0 || idx >= cur.length)
        throw new EditError(`array index "${token}" out of range at /${tokens.slice(0, i + 1).join('/')}`)
      cur = cur[idx]
    } else if (cur !== null && typeof cur === 'object') {
      const obj = cur as Record<string, unknown>
      if (!(token in obj))
        throw new EditError(`path not found: /${tokens.slice(0, i + 1).join('/')}`)
      cur = obj[token]
    } else {
      throw new EditError(`cannot descend into a primitive at /${tokens.slice(0, i + 1).join('/')}`)
    }
  }
  return { parent: cur, token: tokens[tokens.length - 1] }
}

function setAt(doc: unknown, pointer: string, value: unknown): void {
  const { parent, token } = resolveParent(doc, pointer)
  if (Array.isArray(parent)) {
    const idx = Number(token)
    if (!Number.isInteger(idx) || idx < 0 || idx >= parent.length)
      throw new EditError(`array index "${token}" out of range at ${pointer}`)
    parent[idx] = value
  } else if (parent !== null && typeof parent === 'object') {
    ;(parent as Record<string, unknown>)[token] = value
  } else {
    throw new EditError(`cannot set a property on a primitive at ${pointer}`)
  }
}

function insertAt(doc: unknown, pointer: string, value: unknown): void {
  const { parent, token } = resolveParent(doc, pointer)
  if (!Array.isArray(parent))
    throw new EditError(`insert target parent is not an array at ${pointer}`)
  const idx = token === '-' ? parent.length : Number(token)
  if (!Number.isInteger(idx) || idx < 0 || idx > parent.length)
    throw new EditError(`array index "${token}" out of range at ${pointer}`)
  parent.splice(idx, 0, value)
}

function removeAt(doc: unknown, pointer: string): unknown {
  const { parent, token } = resolveParent(doc, pointer)
  if (Array.isArray(parent)) {
    const idx = Number(token)
    if (!Number.isInteger(idx) || idx < 0 || idx >= parent.length)
      throw new EditError(`array index "${token}" out of range at ${pointer}`)
    return parent.splice(idx, 1)[0]
  }
  if (parent !== null && typeof parent === 'object') {
    const obj = parent as Record<string, unknown>
    if (!(token in obj)) throw new EditError(`path not found: ${pointer}`)
    const old = obj[token]
    delete obj[token]
    return old
  }
  throw new EditError(`cannot remove from a primitive at ${pointer}`)
}

// ---------- Applying edits ----------

export interface AppliedEdit {
  edit: CvEdit
  ok: boolean
  error?: string
}

export interface ApplyOutcome {
  resume: Resume
  results: AppliedEdit[]
}

/**
 * Apply edits sequentially to a deep copy of the resume.
 * A failing edit is recorded and skipped; the rest continue (per the contract).
 */
export function applyEdits(resume: Resume, edits: CvEdit[]): ApplyOutcome {
  const doc = structuredClone(resume) as Resume
  const results: AppliedEdit[] = []
  for (const edit of edits) {
    try {
      switch (edit.op) {
        case 'set':
        case 'replace':
          setAt(doc, edit.path, structuredClone(edit.value))
          break
        case 'insert':
          insertAt(doc, edit.path, structuredClone(edit.value))
          break
        case 'remove':
          removeAt(doc, edit.path)
          break
        case 'move': {
          const value = removeAt(doc, edit.from)
          insertAt(doc, edit.path, value)
          break
        }
      }
      results.push({ edit, ok: true })
    } catch (e) {
      results.push({ edit, ok: false, error: e instanceof Error ? e.message : String(e) })
    }
  }
  return { resume: doc, results }
}
