import { describe, it, expect } from 'vitest'
import { heuristicParse } from '../src/import/heuristicParse'
import { collapseLetterSpacing } from '../src/import/textClean'
import { buildStructuringPrompt } from '../src/prompt/buildStructuringPrompt'

const CV_TEXT = `UTPAL DAS
Head of Product Management
Cologne, Germany
utpal.das@example.com | +49 151 2345 6789 | linkedin.com/in/utpaldas

Professional Summary
Product leader with 15 years building consumer and platform products across mobility and SaaS.
Grew subscription revenue by 30% and led cross-functional teams of 20+ across product and design.

Work Experience
Head of Digital Solutions, Cubonic — 2021 to Present
Led product vision and AI strategy across the digital ecosystem.
`

describe('heuristicParse', () => {
  const { resume, filled } = heuristicParse(CV_TEXT)

  it('pulls out the name (title-cased from all-caps)', () => {
    expect(resume.basics?.name).toBe('Utpal Das')
    expect(filled).toContain('name')
  })

  it('pulls out contact details', () => {
    expect(resume.basics?.email).toBe('utpal.das@example.com')
    expect(resume.basics?.phone).toMatch(/\+49 151 2345 6789/)
    expect(resume.basics?.profiles?.[0]?.username).toBe('utpaldas')
  })

  it('detects the headline and location', () => {
    expect(resume.basics?.label).toBe('Head of Product Management')
    expect(resume.basics?.location?.city).toBe('Cologne')
  })

  it('captures a summary and never invents work history', () => {
    expect(resume.basics?.summary?.length ?? 0).toBeGreaterThan(0)
    expect(resume.basics?.summary?.[0]).toContain('Product leader')
    // Heuristic parser leaves structured work history empty (that's the AI path's job).
    expect(resume.work?.length ?? 0).toBe(0)
  })
})

describe('collapseLetterSpacing', () => {
  it('rejoins letter-spaced headings', () => {
    expect(collapseLetterSpacing('H E A D   O F   P R O D U C T')).toBe('HEAD OF PRODUCT')
  })
  it('leaves normal text alone', () => {
    expect(collapseLetterSpacing('Head of Product Management')).toBe('Head of Product Management')
  })
})

describe('buildStructuringPrompt', () => {
  it('includes the schema and the CV text, asking for one JSON block', () => {
    const p = buildStructuringPrompt('Some CV text here')
    expect(p).toContain('"basics"')
    expect(p).toContain('Some CV text here')
    expect(p.toLowerCase()).toContain('single code block')
  })
})
