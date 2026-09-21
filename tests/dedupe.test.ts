import { describe, it, expect } from 'vitest'
import sample from '../src/data/sample-resume.json'
import { Resume } from '../src/schema/resume'
import { dedupeResume } from '../src/parse/dedupe'
import { parseReply } from '../src/parse/parseReply'

const base = () => structuredClone(sample) as Resume

describe('dedupeResume', () => {
  it('drops exact repeats but keeps the first occurrence and order', () => {
    const { resume, removed } = dedupeResume({
      basics: { summary: ['Alpha line.', 'Beta line.', 'Alpha line.'] },
    } as Resume)
    expect(resume.basics?.summary).toEqual(['Alpha line.', 'Beta line.'])
    expect(removed).toBe(1)
  })

  it('treats case, punctuation and spacing differences as the same line', () => {
    const { resume, removed } = dedupeResume({
      basics: { x_highlights: ['Grew revenue by 40%.', 'grew revenue by 40%', 'Grew   revenue by 40%!'] },
    } as Resume)
    expect(resume.basics?.x_highlights).toEqual(['Grew revenue by 40%.'])
    expect(removed).toBe(2)
  })

  it('keeps genuinely different wording', () => {
    const { resume, removed } = dedupeResume({
      x_coreCompetence: ['Product Strategy', 'Product Analytics', 'Platform Strategy'],
    } as Resume)
    expect(resume.x_coreCompetence).toHaveLength(3)
    expect(removed).toBe(0)
  })

  it('de-duplicates bullets within a job and repeated jobs', () => {
    const { resume, removed } = dedupeResume({
      work: [
        { position: 'Head of Product', name: 'Acme', startDate: '2020', endDate: 'Now',
          highlights: ['Shipped X.', 'Shipped X.', 'Shipped Y.'] },
        { position: 'Head of Product', name: 'Acme', startDate: '2020', endDate: 'Now',
          highlights: ['Shipped X.'] },
      ],
    } as Resume)
    expect(resume.work).toHaveLength(1)
    expect(resume.work?.[0].highlights).toEqual(['Shipped X.', 'Shipped Y.'])
    expect(removed).toBe(2) // one duplicate job + one duplicate bullet
  })

  it('de-duplicates skills by name', () => {
    const { resume } = dedupeResume({
      skills: [{ name: 'Python' }, { name: 'python' }, { name: 'SQL' }],
    } as Resume)
    expect(resume.skills?.map((s) => s.name)).toEqual(['Python', 'SQL'])
  })

  it('leaves a clean resume untouched', () => {
    const before = base()
    const { resume, removed } = dedupeResume(before)
    expect(removed).toBe(0)
    expect(resume).toEqual(before)
  })
})

describe('parseReply de-duplication', () => {
  it('cleans repeated lines out of a full-resume reply and says so', () => {
    const reply =
      '```json\n' +
      JSON.stringify({
        basics: {
          name: 'Robin Fields',
          summary: ['Led product for wellness apps.', 'Led product for wellness apps.'],
        },
      }) +
      '\n```'
    const res = parseReply(reply, base())
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.proposed.basics?.summary).toEqual(['Led product for wellness apps.'])
    expect(res.warnings.join(' ')).toMatch(/repeated/i)
  })

  it('cleans duplicates produced by repeated cv-edits inserts', () => {
    const reply =
      '```cv-edits\n{"edits":[' +
      '{"op":"insert","path":"/basics/x_highlights/0","value":"Doubled activation."},' +
      '{"op":"insert","path":"/basics/x_highlights/0","value":"Doubled activation."}' +
      ']}\n```'
    const res = parseReply(reply, base())
    expect(res.ok).toBe(true)
    if (!res.ok) return
    const hl = res.proposed.basics?.x_highlights ?? []
    expect(hl.filter((h) => /Doubled activation/.test(h))).toHaveLength(1)
  })
})
