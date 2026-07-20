// Pure text-cleaning helpers, kept free of pdf.js so they're unit-testable in
// Node without the browser-only DOMMatrix dependency.

/**
 * PDF text extraction often comes out letter-spaced ("H E A D   O F"). Collapse
 * runs of single characters back into words, using 2+ spaces as a word gap.
 */
export function collapseLetterSpacing(line: string): string {
  const tokens = line.split(/(\s+)/) // keep separators
  const words = line.trim().split(/\s+/).filter(Boolean)
  if (words.length < 4) return line
  const singles = words.filter((w) => w.length === 1).length
  if (singles / words.length < 0.6) return line
  let out = ''
  for (const t of tokens) {
    if (/^\s+$/.test(t)) out += t.length >= 2 ? ' ' : ''
    else out += t
  }
  return out.replace(/\s{2,}/g, ' ').trim()
}

export function cleanText(raw: string): string {
  return raw
    .split('\n')
    .map((l) => collapseLetterSpacing(l.replace(/ /g, ' ')).replace(/[ \t]+/g, ' ').trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
