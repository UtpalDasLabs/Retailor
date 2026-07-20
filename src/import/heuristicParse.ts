import { Resume } from '../schema/resume'
import { emptyResume } from '../data/empty-resume'

// A deterministic, best-effort parse of CV text into structured fields. It fills
// what's reliable — name, contact details, headline, and a summary — and leaves
// work history / education for the user (or the AI path) to complete. It never
// invents data.

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
const PHONE_RE = /(\+?\s?\d[\d\s().-]{6,}\d)/
const LINKEDIN_RE = /linkedin\.com\/in\/([A-Za-z0-9_-]+)/i
const BULLET_RE = /^[•▪·‣◦*]\s+|^[-–]\s+/
// City after a postal code, e.g. "…, 10553 Berlin" → "Berlin".
const POSTAL_CITY_RE = /\b\d{4,5}\s+([A-Z][a-zA-Z.'-]+(?:\s[A-Z][a-zA-Z.'-]+)?)\s*$/

const ROLE_WORDS =
  /\b(Head|VP|Vice President|Director|Lead|Senior|Principal|Manager|Engineer|Designer|Consultant|Officer|Chief|President|Founder|Analyst|Architect|Specialist|Coordinator|Scientist|Developer|Product)\b/i

const SECTION_HEADING =
  /^(professional\s+summary|summary|profile|about(\s+me)?|objective|experience|work\s+experience|employment|education|skills|competenc|projects|certificat|contact)\b/i

// Words that mean a line is an organisation/section, not a person's name.
const NAME_STOPLIST =
  /\b(center|centre|group|gmbh|ltd|inc|llc|university|institute|department|solutions|systems|technolog|services|design|management|strategy|experience|summary|profile|competence|curriculum|vitae|resume)\b/i

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .replace(/\b(De|Van|Von|Da|Der|Den|Di|La|Le)\b/g, (m) => m.toLowerCase())
}

function looksLikeName(line: string): boolean {
  if (/[\d@]/.test(line)) return false
  if (line.length > 40) return false
  const words = line.trim().split(/\s+/)
  if (words.length < 2 || words.length > 4) return false
  const titleCaseName = words.every((w) => /^[A-Z][a-zA-Z.'-]*$/.test(w))
  const allCapsName = words.every((w) => /^[A-Z][A-Z.'-]*$/.test(w))
  return titleCaseName || allCapsName
}

/** Extract a best-effort resume from raw CV text. */
export function heuristicParse(text: string): { resume: Resume; filled: string[] } {
  const resume = emptyResume()
  const b = resume.basics!
  const filled: string[] = []
  const rawLines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  // Track which lines are list bullets (never a name/headline) and keep a
  // de-bulleted copy for matching.
  const isBullet = rawLines.map((l) => BULLET_RE.test(l))
  const lines = rawLines.map((l) => l.replace(BULLET_RE, '').trim())
  // Name and headline only come from the header zone. A wider scan grabs
  // garbage on messy two-column extractions; be conservative and let the AI
  // path fill anything we can't see confidently here.
  const head = lines.slice(0, 12)

  // Contact details (anywhere in the document).
  const email = text.match(EMAIL_RE)?.[0]
  if (email) {
    b.email = email
    filled.push('email')
  }
  const linkedin = text.match(LINKEDIN_RE)?.[1]
  if (linkedin) {
    b.profiles = [{ network: 'LinkedIn', username: linkedin }]
    filled.push('LinkedIn')
  }
  // Phone — search early lines (contact details often share a line with the
  // email, so strip the email out first rather than skipping the whole line).
  for (const l of lines.slice(0, 40)) {
    const cleaned = email ? l.split(email).join(' ') : l
    const m = cleaned.match(PHONE_RE)
    if (m && m[1].replace(/\D/g, '').length >= 8) {
      b.phone = m[1].trim()
      filled.push('phone')
      break
    }
  }

  // Name — earliest name-looking line (never a list bullet or a heading).
  let nameIdx = -1
  for (let i = 0; i < head.length; i++) {
    if (isBullet[i]) continue
    const l = head[i]
    if (SECTION_HEADING.test(l)) continue
    if (email && l.includes(email)) continue
    if (NAME_STOPLIST.test(l)) continue
    if (looksLikeName(l)) {
      b.name = l === l.toUpperCase() ? titleCase(l) : l
      nameIdx = i
      filled.push('name')
      break
    }
  }

  // Headline / role — a role-ish line near the top that isn't the name or a
  // bullet from a skills list.
  for (let i = 0; i < head.length; i++) {
    if (i === nameIdx || isBullet[i]) continue
    const l = head[i]
    if (SECTION_HEADING.test(l)) continue
    if (l.length <= 80 && ROLE_WORDS.test(l) && !EMAIL_RE.test(l) && !/\d{4}/.test(l)) {
      b.label = l.replace(/\s*[|•]\s*$/, '').trim()
      filled.push('headline')
      break
    }
  }

  // Location — a "City, Country" line, or the city after a postal code in an
  // address line (e.g. "…, 10553 Berlin").
  for (const l of head) {
    if (SECTION_HEADING.test(l)) continue
    let city: string | undefined
    if (/^[A-Z][a-zA-Z .'-]+,\s*[A-Z][a-zA-Z .'-]+$/.test(l) && l.length < 40 && !ROLE_WORDS.test(l)) {
      city = l.split(',')[0].trim()
    } else {
      const m = l.match(POSTAL_CITY_RE)
      if (m) city = m[1].trim()
    }
    if (city) {
      b.location = { ...(b.location ?? {}), city }
      filled.push('location')
      break
    }
  }

  // Summary — the block following a Summary/Profile heading, else the first
  // substantial sentence-like paragraph after the header area.
  const summary = extractSummary(lines, nameIdx)
  if (summary.length) {
    b.summary = summary
    filled.push('summary')
  }

  return { resume, filled }
}

function extractSummary(lines: string[], nameIdx: number): string[] {
  const headingIdx = lines.findIndex((l) =>
    /^(professional\s+summary|summary|profile|about(\s+me)?|objective)\s*:?$/i.test(l),
  )
  if (headingIdx >= 0) {
    // Collect the block after the heading, then JOIN wrapped lines back into a
    // single paragraph — PDF extraction breaks one paragraph across many lines.
    const block: string[] = []
    for (let i = headingIdx + 1; i < lines.length && block.length < 12; i++) {
      const l = lines[i]
      if (SECTION_HEADING.test(l) && l.length < 40) break
      if (l.length > 2) block.push(l)
    }
    const joined = block.join(' ').replace(/\s{2,}/g, ' ').trim()
    if (joined.length > 30) return [joined]
  }
  // Fallback: only take clean, complete sentences (start with a capital, end
  // with terminal punctuation) so we never store a mid-sentence fragment.
  const start = nameIdx >= 0 ? nameIdx + 1 : 0
  const out: string[] = []
  for (let i = start; i < lines.length && out.length < 3; i++) {
    const l = lines[i]
    if (SECTION_HEADING.test(l)) continue
    if (l.length > 80 && /^[A-Z]/.test(l) && /[.!?]$/.test(l)) out.push(l)
  }
  return out
}
