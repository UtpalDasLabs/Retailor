import { z } from 'zod'

// The cv-edits block: the contract any LLM can produce to tailor a CV.

const jsonPointer = z
  .string()
  .regex(/^\/(?:[^/~]|~0|~1)*(?:\/(?:[^/~]|~0|~1)*)*$/, {
    message: 'must be a JSON Pointer starting with "/" (e.g. /work/0/highlights/1)',
  })

const base = { why: z.string().optional() }

export const EditSchema = z.discriminatedUnion('op', [
  z.object({ op: z.literal('set'), path: jsonPointer, value: z.unknown(), ...base }),
  z.object({ op: z.literal('replace'), path: jsonPointer, value: z.unknown(), ...base }),
  z.object({ op: z.literal('insert'), path: jsonPointer, value: z.unknown(), ...base }),
  z.object({ op: z.literal('remove'), path: jsonPointer, ...base }),
  z.object({ op: z.literal('move'), from: jsonPointer, path: jsonPointer, ...base }),
])

export const CvEditsSchema = z.object({
  version: z.literal(1, {
    errorMap: () => ({ message: 'only version 1 is supported' }),
  }),
  targetRole: z.string().optional(),
  rationale: z.string().optional(),
  edits: z.array(EditSchema).min(1, 'the edits array must contain at least one edit'),
})

export type CvEdit = z.infer<typeof EditSchema>
export type CvEdits = z.infer<typeof CvEditsSchema>
