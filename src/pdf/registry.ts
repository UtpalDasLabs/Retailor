import { ComponentType } from 'react'
import { Resume } from '../schema/resume'
import { BerlinBlueDocument } from './BerlinBluePdf'

// Adding a template = one entry here plus its react-pdf Document component.
export interface PdfTemplate {
  id: string
  name: string
  Document: ComponentType<{ resume: Resume }>
}

export const TEMPLATES: PdfTemplate[] = [
  { id: 'berlin-blue', name: 'Berlin Blue', Document: BerlinBlueDocument },
]

export function getTemplate(id: string | undefined): PdfTemplate {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0]
}
