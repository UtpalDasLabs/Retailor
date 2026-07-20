import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
// Bundle the pdf.js worker as a same-origin asset — no CDN fetch (that CDN
// stall is exactly what broke the browser CV path in the job-finder project).
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { cleanText } from './textClean'

GlobalWorkerOptions.workerSrc = workerUrl

async function extractPdf(file: File): Promise<string> {
  const data = new Uint8Array(await file.arrayBuffer())
  const pdf = await getDocument({ data }).promise
  const pages: string[] = []
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p)
    const content = await page.getTextContent()
    // Reconstruct lines from text items using their y-position.
    let lastY: number | null = null
    let line = ''
    const lines: string[] = []
    const items = content.items as unknown as Array<{ str: string; transform: number[] }>
    for (const item of items) {
      if (typeof item.str !== 'string') continue
      const y = item.transform[5]
      if (lastY !== null && Math.abs(y - lastY) > 3) {
        lines.push(line)
        line = ''
      }
      line += item.str
      lastY = y
    }
    if (line) lines.push(line)
    pages.push(lines.join('\n'))
  }
  return cleanText(pages.join('\n\n'))
}

async function extractDocx(file: File): Promise<string> {
  // mammoth is heavy — load it only when a DOCX is actually imported.
  const mammoth = await import('mammoth/mammoth.browser.js')
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  return cleanText(result.value)
}

export interface ExtractResult {
  text: string
  kind: 'pdf' | 'docx' | 'text'
}

/** Extract plain text from a PDF, DOCX, or text file — entirely in the browser. */
export async function extractText(file: File): Promise<ExtractResult> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.pdf') || file.type === 'application/pdf') {
    return { text: await extractPdf(file), kind: 'pdf' }
  }
  if (name.endsWith('.docx') || file.type.includes('officedocument.wordprocessingml')) {
    return { text: await extractDocx(file), kind: 'docx' }
  }
  return { text: cleanText(await file.text()), kind: 'text' }
}
