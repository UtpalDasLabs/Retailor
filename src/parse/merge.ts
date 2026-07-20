import { Resume } from '../schema/resume'

// Deep-merge an LLM reply onto the current CV. Rule (from the spec): unknown
// fields are preserved, and fields absent in the reply are inherited from the
// current data. Arrays present in the reply replace the current array wholesale
// (we asked the model for the COMPLETE updated CV, so a provided array is the
// tailored version); an absent array is inherited.

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

function mergeValue(base: unknown, reply: unknown): unknown {
  if (reply === undefined) return base
  if (isPlainObject(base) && isPlainObject(reply)) {
    const out: Record<string, unknown> = { ...base }
    for (const key of Object.keys(reply)) {
      out[key] = mergeValue(base[key], reply[key])
    }
    return out
  }
  // Arrays and scalars: the reply wins when present.
  return reply
}

export function mergeResume(base: Resume, reply: Record<string, unknown>): Resume {
  return mergeValue(base, reply) as Resume
}
