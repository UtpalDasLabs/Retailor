import { Resume } from '../schema/resume'
import { parseAllJsonObjects } from './lenientJson'
import { looksLikeResume, coerceResumeShape } from './resumeShape'
import { mergeResume } from './merge'
import { applyCvEdits } from './cvEdits'
import { Change, diffResumes } from './diff'

export const FIX_IT_SENTENCE =
  'Please resend my complete updated CV as one JSON code block, with no other text after it.'

export type ParseError = {
  code: 'not-a-reply' | 'not-a-cv' | 'unparseable'
  title: string
  body: string
  fixItText?: string
  action: 'go-step-2' | 'copy-fixit'
}

export type ParseResult =
  | {
      ok: true
      proposed: Resume
      changes: Change[]
      warnings: string[]
      via: 'resume' | 'cv-edits'
    }
  | { ok: false; error: ParseError }

function finishResume(base: Resume, replyObj: Record<string, unknown>): ParseResult {
  const merged = mergeResume(base, replyObj)
  const proposed = coerceResumeShape(merged)
  return { ok: true, proposed, changes: diffResumes(base, proposed), warnings: [], via: 'resume' }
}

function finishCvEdits(base: Resume, edits: unknown[]): ParseResult {
  const { proposed, warnings } = applyCvEdits(base, edits)
  const coerced = coerceResumeShape(proposed)
  return { ok: true, proposed: coerced, changes: diffResumes(base, coerced), warnings, via: 'cv-edits' }
}

/**
 * Parse an LLM reply against the current CV. Tries, in order: a full resume
 * JSON (last resume-looking object wins), then a back-compat cv-edits block.
 * Never throws — returns a friendly, actionable error instead.
 */
export function parseReply(reply: string, base: Resume): ParseResult {
  const objects = parseAllJsonObjects(reply)

  if (objects.length > 0) {
    // 1. Full resume JSON — pick the LAST object that looks like a resume.
    const resumeObjs = objects.filter(looksLikeResume)
    if (resumeObjs.length > 0) {
      return finishResume(base, resumeObjs[resumeObjs.length - 1])
    }
    // 2. cv-edits back-compat — last object carrying an `edits` array.
    const editObjs = objects.filter((o) => Array.isArray(o.edits))
    if (editObjs.length > 0) {
      const edits = editObjs[editObjs.length - 1].edits as unknown[]
      return finishCvEdits(base, edits)
    }
    // Data found, but it isn't a CV.
    return {
      ok: false,
      error: {
        code: 'not-a-cv',
        title: 'I found some data, but not a CV',
        body: 'The reply had a code block, but it wasn’t your full CV. Ask your AI to resend it, then paste the whole answer again.',
        fixItText: FIX_IT_SENTENCE,
        action: 'copy-fixit',
      },
    }
  }

  // No JSON object at all.
  const trimmed = reply.trim()
  const hasBrace = trimmed.includes('{')
  if (!hasBrace) {
    return {
      ok: false,
      error: {
        code: 'not-a-reply',
        title: 'This doesn’t look like an AI reply',
        body: 'Go back to step 2, copy the prompt, and paste it into your AI together with the job ad. Then copy the AI’s whole answer and paste it here.',
        action: 'go-step-2',
      },
    }
  }
  // There were braces but nothing parsed — truncated or broken JSON.
  return {
    ok: false,
    error: {
      code: 'unparseable',
      title: 'The CV data looks cut off',
      body: 'I could see the start of a CV but couldn’t read all of it — the reply may have been truncated. Ask your AI to resend it in one piece, then paste the whole answer again.',
      fixItText: FIX_IT_SENTENCE,
      action: 'copy-fixit',
    },
  }
}
