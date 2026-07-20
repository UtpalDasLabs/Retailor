import JSON5 from 'json5'

// Real LLM replies are messy: smart quotes, trailing commas, comments, prose
// wrapped around the JSON, one or several fenced blocks. This module pulls
// every plausible JSON object out of a reply and parses it leniently.

/** Replace typographic characters that break JSON with their ASCII equivalents. */
export function normalizeText(input: string): string {
  return input
    .replace(/[“”„‟″]/g, '"') // “ ” „ ‟ ″ → "
    .replace(/[‘’‚‛′]/g, "'") // ‘ ’ ‚ ‛ ′ → '
    .replace(/ /g, ' ') // non-breaking space
    .replace(/[–—]/g, (m) => m) // keep en/em dashes (valid in strings)
}

/**
 * Scan a string and return every top-level, brace-balanced `{…}` region, in
 * document order. String contents (including escapes) are respected so braces
 * inside strings don't confuse the balancer.
 */
export function extractJsonObjects(text: string): string[] {
  const out: string[] = []
  let depth = 0
  let start = -1
  let inStr = false
  let quote = ''
  let escaped = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inStr) {
      if (escaped) escaped = false
      else if (ch === '\\') escaped = true
      else if (ch === quote) inStr = false
      continue
    }
    // Only treat quotes as string delimiters INSIDE an object. Prose between
    // objects (with apostrophes like "here's") must not be scanned as strings,
    // or a stray apostrophe would swallow the next object's opening brace.
    if (depth > 0 && (ch === '"' || ch === "'")) {
      inStr = true
      quote = ch
      continue
    }
    if (ch === '{') {
      if (depth === 0) start = i
      depth++
    } else if (ch === '}') {
      if (depth > 0) {
        depth--
        if (depth === 0 && start >= 0) {
          out.push(text.slice(start, i + 1))
          start = -1
        }
      }
    }
  }
  return out
}

/** Parse leniently (JSON5 tolerates trailing commas, comments, single quotes). */
export function parseLenient(text: string): unknown | undefined {
  try {
    return JSON5.parse(text)
  } catch {
    return undefined
  }
}

/**
 * Every JSON object parseable out of a reply, in document order. Works whether
 * the JSON is fenced (```json … ```), bare, or surrounded by prose — the fence
 * markers sit outside the braces and are ignored by the balancer.
 */
export function parseAllJsonObjects(reply: string): Record<string, unknown>[] {
  const normalized = normalizeText(reply)
  const objects: Record<string, unknown>[] = []
  for (const candidate of extractJsonObjects(normalized)) {
    const value = parseLenient(candidate)
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      objects.push(value as Record<string, unknown>)
    }
  }
  return objects
}
