import { CvEdits, CvEditsSchema, CvEdit } from '../schema/edits'
import { Resume } from '../schema/resume'

// ---------- Markdown parsing ----------

export type ParseResult =
  | { ok: true; block: CvEdits }
  | { ok: false; errors: string[] }

// LLMs are inconsistent about the exact shape of the block. Rather than reject
// a set of edits over a stringified version number or a synonym like "add",
// we normalize a handful of common, unambiguous variations to the canonical
// form before validating. Anything we can't confidently map is left untouched
// so the schema still reports it.

/** Coerce "1", "1.0", "v1", 1.0 … to the number 1; leave anything else alone. */
function normalizeVersion(v: unknown): unknown {
  if (typeof v === 'number' && v === 1) return 1
  if (typeof v === 'string') {
    const s = v.trim().replace(/^v/i, '')
    if (s !== '' && Number(s) === 1) return 1
  }
  return v
}

function lastPointerToken(path: unknown): string | null {
  if (typeof path !== 'string' || !path.startsWith('/')) return null
  const parts = path.split('/')
  return parts[parts.length - 1] ?? null
}

/** Map common op synonyms to the five canonical ops. */
function normalizeOp(rawOp: unknown, path: unknown): unknown {
  if (typeof rawOp !== 'string') return rawOp
  switch (rawOp.trim().toLowerCase()) {
    case 'set':
    case 'replace':
    case 'insert':
    case 'remove':
    case 'move':
      return rawOp.trim().toLowerCase()
    case 'delete':
    case 'del':
      return 'remove'
    case 'update':
    case 'change':
    case 'modify':
    case 'edit':
      return 'set'
    case 'append':
    case 'prepend':
    case 'push':
      return 'insert'
    case 'add': {
      // JSON-Patch "add": into an array (numeric or "-" last token) it means
      // insert; onto an object key it means set.
      const t = lastPointerToken(path)
      return t !== null && (t === '-' || /^\d+$/.test(t)) ? 'insert' : 'set'
    }
    default:
      return rawOp
  }
}

/** Read a value from a nested object/array by a Zod issue path. */
function readByKeys(root: unknown, keys: (string | number)[]): unknown {
  let cur: unknown = root
  for (const key of keys) {
    if (cur === null || typeof cur !== 'object') return undefined
    cur = (cur as Record<string | number, unknown>)[key]
  }
  return cur
}

/** Best-effort normalization of a parsed cv-edits object before validation. */
function normalizeCvEdits(input: unknown): unknown {
  if (input === null || typeof input !== 'object') return input
  const obj = { ...(input as Record<string, unknown>) }
  if ('version' in obj) obj.version = normalizeVersion(obj.version)
  if (Array.isArray(obj.edits)) {
    obj.edits = obj.edits.map((e) => {
      if (e === null || typeof e !== 'object') return e
      const edit = { ...(e as Record<string, unknown>) }
      if ('op' in edit) edit.op = normalizeOp(edit.op, edit.path)
      return edit
    })
  }
  return obj
}

/** The LAST ```cv-edits fenced block, if any — the explicit contract. */
function lastCvEditsFence(markdown: string): string | null {
  const fenceRe = /```cv-edits[^\S\n]*\n([\s\S]*?)```/g
  let match: RegExpExecArray | null
  let last: string | null = null
  while ((match = fenceRe.exec(markdown)) !== null) last = match[1]
  return last
}

/** Does this text parse to an object carrying an `edits` array? */
function looksLikeCvEdits(text: string): boolean {
  try {
    const o = JSON.parse(text) as { edits?: unknown }
    return o !== null && typeof o === 'object' && Array.isArray(o.edits)
  } catch {
    return false
  }
}

/**
 * When there's no explicit cv-edits fence, be forgiving: accept the JSON from
 * any fenced block that carries an `edits` array, or a bare JSON object pasted
 * on its own. The last qualifying candidate wins.
 */
function fallbackCvEditsJson(markdown: string): string | null {
  const fenceRe = /```[^\n]*\n([\s\S]*?)```/g
  let match: RegExpExecArray | null
  let found: string | null = null
  while ((match = fenceRe.exec(markdown)) !== null) {
    if (looksLikeCvEdits(match[1])) found = match[1]
  }
  if (found !== null) return found
  const first = markdown.indexOf('{')
  const last = markdown.lastIndexOf('}')
  if (first >= 0 && last > first) {
    const sub = markdown.slice(first, last + 1)
    if (looksLikeCvEdits(sub)) return sub
  }
  return null
}

/**
 * Locate the cv-edits data in an LLM reply, parse its JSON and validate it.
 * Prefers an explicit ```cv-edits fence; falls back to any block (or bare
 * JSON) containing an `edits` array. Returns friendly errors on failure.
 */
export function parseCvEditsMarkdown(markdown: string): ParseResult {
  const last = lastCvEditsFence(markdown) ?? fallbackCvEditsJson(markdown)
  if (last === null) {
    return {
      ok: false,
      errors: [
        'No cv-edits data found in this document.',
        'Paste the LLM reply that ends with a ```cv-edits code block, or the cv-edits JSON on its own (see the Prompt Pack above).',
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
  const normalized = normalizeCvEdits(json)
  const result = CvEditsSchema.safeParse(normalized)
  if (!result.success) {
    return {
      ok: false,
      errors: result.error.issues.map((i) => {
        const where = i.path.length ? i.path.join('.') : '(root)'
        // Surface the offending op value — the raw zod discriminator message
        // ("Invalid discriminator value…") doesn't say what was actually there.
        if (i.path.length >= 2 && i.path[i.path.length - 1] === 'op') {
          const val = readByKeys(normalized, i.path)
          return `${where}: ${JSON.stringify(val)} is not a valid op — use one of set, replace, insert, remove, move`
        }
        return `${where}: ${i.message}`
      }),
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
