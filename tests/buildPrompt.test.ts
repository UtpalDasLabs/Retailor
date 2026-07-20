import { describe, it, expect } from 'vitest'
import sample from '../src/data/sample-resume.json'
import { Resume } from '../src/schema/resume'
import { buildPrompt, OUTPUT_CONTRACT } from '../src/prompt/buildPrompt'

describe('buildPrompt', () => {
  const resume = structuredClone(sample) as Resume

  it('includes the four sections in the required order', () => {
    const p = buildPrompt(resume)
    const iRole = p.indexOf('senior hiring manager')
    const iCv = p.indexOf('"name": "Robin Fields"')
    const iContract = p.indexOf(OUTPUT_CONTRACT)
    const iJobAd = p.indexOf('[PASTE THE JOB AD BELOW]')
    expect(iRole).toBeGreaterThanOrEqual(0)
    expect(iCv).toBeGreaterThan(iRole)
    expect(iContract).toBeGreaterThan(iCv)
    expect(iJobAd).toBeGreaterThan(iContract)
  })

  it('never leaks the photo data URL', () => {
    const withPhoto = structuredClone(resume) as Resume
    withPhoto.basics!.picture = 'data:image/jpeg;base64,AAAAersecret'
    const p = buildPrompt(withPhoto)
    expect(p).not.toContain('base64')
  })

  it('keeps the placeholder when no job ad is given', () => {
    const p = buildPrompt(resume)
    expect(p).toContain('[PASTE THE JOB AD BELOW]')
    expect(p.trimEnd().endsWith('[PASTE THE JOB AD BELOW]')).toBe(true)
  })

  it('embeds the job ad inline (and drops the placeholder) when provided', () => {
    const ad = 'Senior PM wanted. Must own mobile subscription growth.'
    const p = buildPrompt(resume, ad)
    expect(p).not.toContain('[PASTE THE JOB AD BELOW]')
    expect(p).toContain(ad)
    // The CV JSON comes before the job ad; the ad is at the very end.
    expect(p.indexOf('"name": "Robin Fields"')).toBeLessThan(p.indexOf(ad))
    expect(p.trimEnd().endsWith(ad)).toBe(true)
  })

  it('ignores a whitespace-only job ad', () => {
    const p = buildPrompt(resume, '   \n  ')
    expect(p).toContain('[PASTE THE JOB AD BELOW]')
  })
})
