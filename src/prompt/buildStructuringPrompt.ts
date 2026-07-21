// Prompt for the AI-assisted import path: turn raw CV text (extracted from a
// PDF/DOCX in the browser) into Retailor's CV JSON. The reply flows back through
// the same parser used in Step 3, so the output contract matches a full resume.

const SCHEMA_HINT = `{
  "basics": { "name": "", "label": "", "email": "", "phone": "", "url": "",
    "location": { "city": "", "countryCode": "" },
    "profiles": [ { "network": "LinkedIn", "username": "" } ],
    "summary": ["paragraph", "..."], "x_highlights": ["bullet", "..."] },
  "work": [ { "position": "", "name": "company", "startDate": "", "endDate": "", "highlights": ["bullet"] } ],
  "education": [ { "institution": "", "area": "", "studyType": "", "startDate": "", "endDate": "" } ],
  "certificates": [ { "name": "", "issuer": "", "date": "" } ],
  "awards": [ { "title": "", "awarder": "" } ],
  "languages": [ { "language": "", "fluency": "" } ],
  "skills": [ { "name": "", "keywords": ["..."] } ],
  "x_coreCompetence": ["skill"], "x_portfolio": ["item"],
  "x_memberships": [ { "organization": "", "since": "" } ]
}`

export function buildStructuringPrompt(cvText: string): string {
  return [
    'Convert the CV below into JSON with exactly this structure (omit fields you don’t find; never invent anything that isn’t in the text):',
    '```json',
    SCHEMA_HINT,
    '```',
    'Rules: dates as written in the CV; "summary" is an array of paragraphs; each job’s bullet points go in its "highlights" array. Output ONLY the completed JSON as a single code block, and make it the last thing in your reply.',
    '',
    'Here is the CV text:',
    '"""',
    cvText,
    '"""',
  ].join('\n')
}
