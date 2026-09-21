import { createElement, ReactElement } from 'react'
import { pdf, DocumentProps } from '@react-pdf/renderer'
import { getDocument } from 'pdfjs-dist'
import { Resume } from '../schema/resume'
import { registerPdfFonts } from './fonts'
import { getTemplate } from './registry'
import '../preview/pdfWorker'

// A last page holding less than this many characters is a straggler — a couple
// of bullets or one short section that just missed the previous page.
const NEARLY_EMPTY_CHARS = 500
// Progressively tighter whitespace to try. Only margins shrink, never font
// sizes, so a compact render reads the same — it just fits.
const COMPACT_LADDER = [0.85, 0.72, 0.6]

async function measure(blob: Blob): Promise<{ pages: number; lastChars: number }> {
  const data = new Uint8Array(await blob.arrayBuffer())
  const doc = await getDocument({ data }).promise
  const pages = doc.numPages
  const page = await doc.getPage(pages)
  const content = await page.getTextContent()
  const items = content.items as unknown as Array<{ str?: string }>
  const lastChars = items
    .map((i) => i.str ?? '')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim().length
  return { pages, lastChars }
}

/**
 * Generate the CV as a PDF Blob using the resume's selected template.
 *
 * If the last page holds almost nothing, the document is re-rendered with
 * progressively tighter whitespace and the first version that actually saves a
 * page wins. Measuring is best-effort — any failure just returns the normal
 * render.
 */
export async function renderResumePdf(resume: Resume): Promise<Blob> {
  registerPdfFonts()
  const template = getTemplate(resume.meta?.template)
  const render = (density?: number) =>
    pdf(
      createElement(template.Document, { resume, density }) as ReactElement<DocumentProps>,
    ).toBlob()

  const blob = await render()
  try {
    const { pages, lastChars } = await measure(blob)
    if (pages > 1 && lastChars < NEARLY_EMPTY_CHARS) {
      for (const density of COMPACT_LADDER) {
        const compact = await render(density)
        if ((await measure(compact)).pages < pages) return compact
      }
    }
  } catch {
    // Couldn't inspect the PDF — keep the normal render.
  }
  return blob
}

/** A filename like `Robin-Fields-CV.pdf`. */
export function pdfFileName(resume: Resume): string {
  const name = (resume.basics?.name ?? 'My').trim().replace(/\s+/g, '-').replace(/[^A-Za-z0-9-]/g, '')
  return `${name || 'My'}-CV.pdf`
}
