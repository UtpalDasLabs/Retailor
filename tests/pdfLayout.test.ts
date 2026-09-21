import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { Font, renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { extractText, getDocumentProxy } from 'unpdf'
import { BerlinBlueDocument } from '../src/pdf/BerlinBluePdf'
import { Resume } from '../src/schema/resume'

// Regression guard: a column's paddingBottom used to spill onto a new page when
// content ended near the boundary, producing a completely blank trailing page.

const F = new URL('../src/pdf/fonts/', import.meta.url).pathname

beforeAll(() => {
  Font.register({
    family: 'SourceSans3',
    fonts: [
      { src: `${F}SourceSans3-Regular.ttf`, fontWeight: 400 },
      { src: `${F}SourceSans3-Bold.ttf`, fontWeight: 700 },
      { src: `${F}SourceSans3-It.ttf`, fontWeight: 400, fontStyle: 'italic' },
      { src: `${F}SourceSans3-BoldIt.ttf`, fontWeight: 700, fontStyle: 'italic' },
    ],
  })
  Font.register({
    family: 'SourceSerif4',
    fonts: [
      { src: `${F}SourceSerif4-It.ttf`, fontWeight: 400, fontStyle: 'italic' },
      { src: `${F}SourceSerif4-BoldIt.ttf`, fontWeight: 700, fontStyle: 'italic' },
    ],
  })
  Font.registerHyphenationCallback((w: string) => [w])
})

function sidebarHeavy(portfolioItems: number): Resume {
  return {
    basics: {
      name: 'Utpal Das',
      label: 'VP Product',
      email: 'a@b.com',
      summary: ['One short summary line.'],
    },
    x_coreCompetence: ['Alpha', 'Beta'],
    x_portfolio: Array.from({ length: portfolioItems }, (_, i) => `Portfolio item number ${i + 1}`),
    work: [
      {
        position: 'Head of Product',
        name: 'Cubonic',
        startDate: '2021',
        endDate: 'Now',
        highlights: ['One bullet only.'],
      },
    ],
    meta: { template: 'berlin-blue' },
  } as Resume
}

async function charsPerPage(resume: Resume): Promise<number[]> {
  const buf = await renderToBuffer(createElement(BerlinBlueDocument, { resume }))
  const pdf = await getDocumentProxy(new Uint8Array(buf))
  const { text } = await extractText(pdf, { mergePages: false })
  return (text as string[]).map((t) => t.replace(/\s+/g, ' ').trim().length)
}

describe('berlin-blue pagination', () => {
  it('never emits a blank page anywhere around the page boundary', async () => {
    // Sweep a range so the guard catches a blank page wherever the boundary
    // happens to fall (23 portfolio items reproduced it before the fix).
    const blanks: string[] = []
    for (let n = 14; n <= 30; n++) {
      const per = await charsPerPage(sidebarHeavy(n))
      if (per.some((chars) => chars === 0)) blanks.push(`${n} items -> [${per}]`)
    }
    expect(blanks, `blank page(s) produced:\n${blanks.join('\n')}`).toEqual([])
  }, 120_000)
})

// A real, long two-column CV — the shape that produced a 115-character third
// page, a missing website and a job header stranded at the foot of page 1.
const longCv = JSON.parse(
  readFileSync(new URL('../fixtures/long-cv.json', import.meta.url), 'utf8'),
) as Resume

async function pageTexts(resume: Resume, density?: number): Promise<string[]> {
  const buf = await renderToBuffer(createElement(BerlinBlueDocument, { resume, density }))
  const pdf = await getDocumentProxy(new Uint8Array(buf))
  const { text } = await extractText(pdf, { mergePages: false })
  return (text as string[]).map((t) => t.replace(/\s+/g, ' ').trim())
}

// Mirrors renderResumePdf: if the last page is nearly empty, try progressively
// tighter whitespace and take the first render that saves a page.
async function withAutoFit(resume: Resume): Promise<string[]> {
  let pages = await pageTexts(resume)
  if (pages.length > 1 && pages[pages.length - 1].length < 500) {
    for (const density of [0.85, 0.72, 0.6]) {
      const compact = await pageTexts(resume, density)
      if (compact.length < pages.length) {
        pages = compact
        break
      }
    }
  }
  return pages
}

describe('a real long CV', () => {
  it('renders the website that was entered in step 1', async () => {
    const pages = await pageTexts(longCv)
    expect(pages.join(' ')).toContain('utpaldaslabs.github.io')
  }, 60_000)

  // A page ending on "<Company> | <dates>" means the job's bullets fell overleaf.
  const HEADER_AT_FOOT =
    /\|\s*[A-Z][a-z]{2}\s*\d{4}\s*[–-]\s*(Present|[A-Z][a-z]{2}\s*\d{4})\s*$/

  function withBullets(n: number): Resume {
    const cv = JSON.parse(JSON.stringify(longCv)) as Resume
    cv.work![0].highlights = [
      cv.work![0].highlights![0],
      ...Array.from(
        { length: n },
        (_, i) => `Extra achievement ${i + 1} delivering a measurable outcome for the organization.`,
      ),
    ]
    return cv
  }

  it('never leaves a job title stranded at the foot of a page', async () => {
    // Sweep the length of the first job so a header crosses the page boundary
    // at some point; only one length strands it, hence the range rather than a
    // single sample.
    const stranded: string[] = []
    for (let n = 1; n <= 18; n++) {
      const pages = await pageTexts(withBullets(n))
      pages.slice(0, -1).forEach((t, i) => {
        const tail = t.slice(-90)
        if (HEADER_AT_FOOT.test(tail)) stranded.push(`${n} bullets -> page ${i + 1} ends "…${tail}"`)
      })
    }
    expect(stranded, `job header left at a page foot:\n${stranded.join('\n')}`).toEqual([])
  }, 180_000)

  it('does not finish on a barely-filled page', async () => {
    const pages = await withAutoFit(longCv)
    const last = pages[pages.length - 1].length
    expect(last, `last page holds only ${last} characters across ${pages.length} pages`).toBeGreaterThan(
      500,
    )
  }, 120_000)
})
