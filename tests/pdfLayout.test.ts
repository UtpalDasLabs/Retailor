import { describe, it, expect, beforeAll } from 'vitest'
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
