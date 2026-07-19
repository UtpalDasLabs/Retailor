import { Resume } from '../schema/resume'

/**
 * A blank CV. This is what a first-time visitor sees, so every field in the
 * editor starts empty instead of showing sample data. The template id is set
 * so the Preview has a design to render once the user adds content.
 */
export function emptyResume(): Resume {
  return {
    basics: {
      name: '',
      label: '',
      email: '',
      phone: '',
      location: { address: '', postalCode: '', city: '', countryCode: '' },
      profiles: [{ network: 'LinkedIn', username: '' }],
      summary: [],
      x_highlights: [],
      x_birthDate: '',
      x_residency: '',
      picture: null,
    },
    work: [],
    education: [],
    certificates: [],
    awards: [],
    languages: [],
    x_coreCompetence: [],
    x_advisory: [],
    x_portfolio: [],
    x_memberships: [],
    meta: { template: 'berlin-blue' },
  }
}
