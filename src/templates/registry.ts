import { ComponentType } from 'react'
import { Resume } from '../schema/resume'
import { BerlinBlue } from './berlin-blue/BerlinBlue'

export interface TemplateProps {
  resume: Resume
}

export interface TemplateDef {
  id: string
  name: string
  component: ComponentType<TemplateProps>
}

// Adding a template = new folder under src/templates/ + one entry here.
export const templates: TemplateDef[] = [
  { id: 'berlin-blue', name: 'Berlin Blue', component: BerlinBlue },
]

export function getTemplate(id?: string): TemplateDef {
  return templates.find((t) => t.id === id) ?? templates[0]
}
