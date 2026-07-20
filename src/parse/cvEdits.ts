import { Resume } from '../schema/resume'

// Back-compat path: apply a v1-style `cv-edits` block, but forgivingly. We
// ignore `version`, map op synonyms to the five real ops, and skip any single
// edit that can't apply (collecting a human warning) so the rest still land.

export interface CvEditsResult {
  proposed: Resume
  warnings: string[]
  applied: number
}

const OP_SYNONYMS: Record<string, string> = {
  set: 'set',
  replace: 'set',
  insert: 'insert',
  add: 'add', // resolved by path below
  append: 'insert',
  prepend: 'insert',
  push: 'insert',
  update: 'set',
  change: 'set',
  edit: 'set',
  modify: 'set',
  rewrite: 'set',
  revise: 'set',
  remove: 'remove',
  delete: 'remove',
  drop: 'remove',
  del: 'remove',
  move: 'move',
  reorder: 'move',
}

function parsePointer(pointer: string): string[] {
  if (pointer === '') return []
  if (!pointer.startsWith('/')) throw new Error(`invalid path "${pointer}"`)
  return pointer
    .slice(1)
    .split('/')
    .map((t) => t.replace(/~1/g, '/').replace(/~0/g, '~'))
}

function getAtPointer(doc: unknown, pointer: string): unknown {
  let cur: unknown = doc
  for (const token of parsePointer(pointer)) {
    if (Array.isArray(cur)) {
      const idx = Number(token)
      if (!Number.isInteger(idx) || idx < 0 || idx >= cur.length) return undefined
      cur = cur[idx]
    } else if (cur !== null && typeof cur === 'object') {
      cur = (cur as Record<string, unknown>)[token]
    } else {
      return undefined
    }
  }
  return cur
}

function resolveParent(doc: unknown, pointer: string): { parent: unknown; token: string } {
  const tokens = parsePointer(pointer)
  if (tokens.length === 0) throw new Error('cannot edit the document root')
  let cur: unknown = doc
  for (let i = 0; i < tokens.length - 1; i++) {
    const token = tokens[i]
    if (Array.isArray(cur)) {
      const idx = Number(token)
      if (!Number.isInteger(idx) || idx < 0 || idx >= cur.length)
        throw new Error(`no item at ${pointer}`)
      cur = cur[idx]
    } else if (cur !== null && typeof cur === 'object') {
      const obj = cur as Record<string, unknown>
      if (!(token in obj)) throw new Error(`path not found: ${pointer}`)
      cur = obj[token]
    } else {
      throw new Error(`path not found: ${pointer}`)
    }
  }
  return { parent: cur, token: tokens[tokens.length - 1] }
}

function setAt(doc: unknown, pointer: string, value: unknown): void {
  const current = getAtPointer(doc, pointer)
  const next = Array.isArray(current) && !Array.isArray(value) ? [value] : value
  const { parent, token } = resolveParent(doc, pointer)
  if (Array.isArray(parent)) {
    const idx = Number(token)
    if (!Number.isInteger(idx) || idx < 0 || idx >= parent.length)
      throw new Error(`no item at ${pointer}`)
    parent[idx] = next
  } else if (parent !== null && typeof parent === 'object') {
    ;(parent as Record<string, unknown>)[token] = next
  } else {
    throw new Error(`cannot set ${pointer}`)
  }
}

function insertAt(doc: unknown, pointer: string, value: unknown): void {
  const { parent, token } = resolveParent(doc, pointer)
  if (!Array.isArray(parent)) throw new Error(`${pointer} is not a list`)
  const idx = token === '-' ? parent.length : Number(token)
  if (!Number.isInteger(idx) || idx < 0 || idx > parent.length)
    throw new Error(`bad list position ${pointer}`)
  parent.splice(idx, 0, value)
}

function removeAt(doc: unknown, pointer: string): unknown {
  const { parent, token } = resolveParent(doc, pointer)
  if (Array.isArray(parent)) {
    const idx = Number(token)
    if (!Number.isInteger(idx) || idx < 0 || idx >= parent.length)
      throw new Error(`no item at ${pointer}`)
    return parent.splice(idx, 1)[0]
  }
  if (parent !== null && typeof parent === 'object') {
    const obj = parent as Record<string, unknown>
    if (!(token in obj)) throw new Error(`path not found: ${pointer}`)
    const old = obj[token]
    delete obj[token]
    return old
  }
  throw new Error(`cannot remove ${pointer}`)
}

function lastToken(path: unknown): string | null {
  if (typeof path !== 'string' || !path.startsWith('/')) return null
  const parts = path.split('/')
  return parts[parts.length - 1] ?? null
}

function canonicalOp(rawOp: unknown, path: unknown): string | null {
  if (typeof rawOp !== 'string') return null
  const mapped = OP_SYNONYMS[rawOp.trim().toLowerCase()]
  if (!mapped) return null
  if (mapped === 'add') {
    const t = lastToken(path)
    return t !== null && (t === '-' || /^\d+$/.test(t)) ? 'insert' : 'set'
  }
  return mapped
}

export function applyCvEdits(base: Resume, edits: unknown[]): CvEditsResult {
  const doc = structuredClone(base) as Resume
  const warnings: string[] = []
  let applied = 0

  edits.forEach((raw, i) => {
    if (raw === null || typeof raw !== 'object') {
      warnings.push(`Edit ${i + 1}: not a valid edit — skipped.`)
      return
    }
    const edit = raw as Record<string, unknown>
    const op = canonicalOp(edit.op, edit.path)
    if (!op) {
      warnings.push(`Edit ${i + 1}: unknown action "${String(edit.op)}" — skipped.`)
      return
    }
    try {
      const path = String(edit.path ?? '')
      switch (op) {
        case 'set':
          setAt(doc, path, structuredClone(edit.value))
          break
        case 'insert':
          insertAt(doc, path, structuredClone(edit.value))
          break
        case 'remove':
          removeAt(doc, path)
          break
        case 'move': {
          const value = removeAt(doc, String(edit.from ?? ''))
          insertAt(doc, path, value)
          break
        }
      }
      applied++
    } catch (e) {
      warnings.push(`Edit ${i + 1} (${op} ${String(edit.path)}): ${e instanceof Error ? e.message : String(e)} — skipped.`)
    }
  })

  return { proposed: doc, warnings, applied }
}
