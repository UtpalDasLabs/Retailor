import { createElement, ReactElement } from 'react'
import { pdf, DocumentProps } from '@react-pdf/renderer'
import { Resume } from '../schema/resume'
import { registerPdfFonts } from './fonts'
import { getTemplate } from './registry'

/** Generate the CV as a PDF Blob using the resume's selected template. */
export async function renderResumePdf(resume: Resume): Promise<Blob> {
  registerPdfFonts()
  const template = getTemplate(resume.meta?.template)
  // The template renders a <Document> at its root; cast for pdf()'s prop type.
  const element = createElement(template.Document, { resume }) as ReactElement<DocumentProps>
  return pdf(element).toBlob()
}

/** A filename like `Robin-Fields-CV.pdf`. */
export function pdfFileName(resume: Resume): string {
  const name = (resume.basics?.name ?? 'My').trim().replace(/\s+/g, '-').replace(/[^A-Za-z0-9-]/g, '')
  return `${name || 'My'}-CV.pdf`
}
