import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import sample from '../src/data/sample-resume.json'
import { Resume } from '../src/schema/resume'
import { parseReply } from '../src/parse/parseReply'
import { applyChanges, defaultAcceptedIds } from '../src/parse/diff'

const here = dirname(fileURLToPath(import.meta.url))
const fx = (name: string) => readFileSync(join(here, '..', 'fixtures', name), 'utf8')
const base = () => structuredClone(sample) as Resume

describe('parseReply — full resume replies', () => {
  it('(a) reads a realistic prose + JSON reply and diffs it', () => {
    const res = parseReply(fx('a-good-reply.md'), base())
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.via).toBe('resume')
    // Fields absent from the reply are inherited from the current CV.
    expect(res.proposed.education?.length).toBe(base().education?.length)
    expect(res.proposed.basics?.email).toBe('robin.fields@example.com')
    // Label was tailored → shows up as a change.
    const labelChange = res.changes.find((c) => c.id === 'basics.label')
    expect(labelChange?.after).toContain('Subscription & Platform Growth')
    // Summary and the first work item changed.
    expect(res.changes.find((c) => c.id === 'basics.summary')).toBeTruthy()
    expect(res.changes.find((c) => c.id === 'work.0')).toBeTruthy()
    // No spurious name change.
    expect(res.changes.find((c) => c.id === 'basics.name')).toBeFalsy()
  })

  it('(b) tolerates trailing commas and smart quotes', () => {
    const res = parseReply(fx('b-trailing-commas-smart-quotes.md'), base())
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.proposed.basics?.label).toBe('Director of Product — Platform & Growth')
    expect(res.proposed.x_coreCompetence).toEqual([
      'Platform Product Strategy',
      'Subscription Growth & Pricing',
      'Experimentation & A/B Testing',
    ])
  })

  it('(d) picks the LAST resume-looking JSON block, not the example', () => {
    const res = parseReply(fx('d-two-json-blocks.md'), base())
    expect(res.ok).toBe(true)
    if (!res.ok) return
    // Must keep the real person, not the "Jane Example" illustration.
    expect(res.proposed.basics?.name).toBe('Robin Fields')
    expect(res.proposed.basics?.label).toBe('Head of Product — Growth & Retention')
    expect(res.changes.find((c) => c.id === 'basics.name')).toBeFalsy()
  })
})

describe('parseReply — cv-edits back-compat', () => {
  it('(c) applies WRONG op names via synonyms and ignores version:2', () => {
    const res = parseReply(fx('c-cvedits-wrong-ops.md'), base())
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.via).toBe('cv-edits')
    // modify → set
    expect(res.proposed.basics?.label).toBe('VP Product — Platform & Subscriptions')
    // add (array index) → insert
    expect(res.proposed.basics?.x_highlights?.[0]).toBe(
      'Scaled a subscription platform to millions of paying users.',
    )
    // rewrite → set
    expect(res.proposed.work?.[0].highlights?.[0]).toBe(
      'Grew paid subscriptions by 40% in 18 months.',
    )
    // delete → remove (portfolio had 10 items, now 9)
    expect(res.proposed.x_portfolio?.length).toBe((base().x_portfolio?.length ?? 0) - 1)
    expect(res.warnings).toEqual([])
  })

  it('skips invalid edits with a warning but applies the rest', () => {
    const reply =
      '```cv-edits\n{"edits":[' +
      '{"op":"set","path":"/basics/label","value":"Kept"},' +
      '{"op":"frobnicate","path":"/basics/name"},' +
      '{"op":"remove","path":"/work/99"}' +
      ']}\n```'
    const res = parseReply(reply, base())
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.proposed.basics?.label).toBe('Kept')
    expect(res.warnings.length).toBe(2)
  })
})

describe('parseReply — guard rails and errors', () => {
  it('(f) flags a rename and defaults it OFF', () => {
    const res = parseReply(fx('f-renames-person.md'), base())
    expect(res.ok).toBe(true)
    if (!res.ok) return
    const nameChange = res.changes.find((c) => c.id === 'basics.name')
    expect(nameChange).toBeTruthy()
    expect(nameChange?.flagged).toBe(true)
    expect(nameChange?.before).toBe('Robin Fields')
    expect(nameChange?.after).toBe('Bobby Fields')
    // Default selection keeps the label change but NOT the rename.
    const accepted = defaultAcceptedIds(res.changes)
    expect(accepted.has('basics.name')).toBe(false)
    const applied = applyChanges(base(), res.changes, accepted)
    expect(applied.basics?.name).toBe('Robin Fields') // rename not applied
    expect(applied.basics?.label).toBe('Head of Product — Subscription Growth')
  })

  it('(e) shows the friendly step-2 error for garbage/URL text', () => {
    const res = parseReply(fx('e-garbage-url.txt'), base())
    expect(res.ok).toBe(false)
    if (res.ok) return
    expect(res.error.code).toBe('not-a-reply')
    expect(res.error.action).toBe('go-step-2')
  })

  it('shows a not-a-CV error when JSON is present but not a resume', () => {
    const res = parseReply('```json\n{"fit_score": 7, "notes": "good"}\n```', base())
    expect(res.ok).toBe(false)
    if (res.ok) return
    expect(res.error.code).toBe('not-a-cv')
    expect(res.error.fixItText).toBeTruthy()
  })

  it('shows a truncated-data error when JSON is broken', () => {
    const res = parseReply('Sure! Here is your CV:\n```json\n{"basics": {"name": "Robin", ', base())
    expect(res.ok).toBe(false)
    if (res.ok) return
    expect(res.error.code).toBe('unparseable')
  })
})

describe('applyChanges — toggling', () => {
  it('applies only accepted changes onto the base', () => {
    const res = parseReply(fx('a-good-reply.md'), base())
    expect(res.ok).toBe(true)
    if (!res.ok) return
    // Accept only the label change.
    const applied = applyChanges(base(), res.changes, new Set(['basics.label']))
    expect(applied.basics?.label).toContain('Subscription & Platform Growth')
    // Summary untouched (still the original 4 paragraphs).
    expect(applied.basics?.summary?.length).toBe(base().basics?.summary?.length)
  })
})
