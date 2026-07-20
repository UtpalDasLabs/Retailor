import { Resume } from '../schema/resume'

// The message the user copies into their AI. Order is fixed by spec:
// 1) role instruction, 2) the CV JSON inline, 3) the verbatim output contract,
// 4) the job-ad placeholder line.

// Verbatim output contract — do not paraphrase; the parser depends on the model
// returning the COMPLETE CV as the last JSON block.
export const OUTPUT_CONTRACT =
  'First give your assessment in plain language. Then output the candidate\'s COMPLETE updated CV as one JSON code block, same structure as provided, with your recommended tailoring applied. Rules: never invent employers, dates, titles, degrees, or numbers not present in the original; only rephrase, reorder, emphasize, or trim. The JSON block must be the last thing in your reply.'

const industryHint = (resume: Resume): string => {
  const label = resume.basics?.label?.trim()
  return label ? ` (their background: ${label})` : ''
}

/** The prompt the user pastes into ChatGPT/Claude/Gemini/Perplexity. */
export function buildPrompt(resume: Resume): string {
  // Strip the in-browser-only photo data URL — it's huge and irrelevant to the AI.
  const forAi = structuredClone(resume) as Resume
  if (forAi.basics) delete forAi.basics.picture
  const cvJson = JSON.stringify(forAi, null, 2)

  return [
    `You are a senior hiring manager in the candidate's industry${industryHint(resume)}. Assess how well this candidate fits the job ad I will paste at the end, and be honest about gaps — don't flatter.`,
    '',
    'Here is my current CV as JSON:',
    '```json',
    cvJson,
    '```',
    '',
    OUTPUT_CONTRACT,
    '',
    'Here is the job ad: [PASTE THE JOB AD BELOW]',
  ].join('\n')
}
