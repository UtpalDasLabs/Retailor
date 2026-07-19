import { z } from 'zod'

// JSON Resume schema (subset we render) + Retailor x_ extensions.
// Every object is .passthrough() so unknown fields survive import → edit → export.

const str = z.string()

export const LocationSchema = z
  .object({
    address: str.optional(),
    postalCode: str.optional(),
    city: str.optional(),
    countryCode: str.optional(),
    region: str.optional(),
  })
  .passthrough()

export const ProfileSchema = z
  .object({
    network: str.optional(),
    username: str.optional(),
    url: str.optional(),
  })
  .passthrough()

export const BasicsSchema = z
  .object({
    name: str.optional(),
    label: str.optional(),
    email: str.optional(),
    phone: str.optional(),
    url: str.optional(),
    location: LocationSchema.optional(),
    profiles: z.array(ProfileSchema).optional(),
    // Extensions
    summary: z.array(str).optional(), // paragraphs
    x_highlights: z.array(str).optional(),
    x_birthDate: str.optional(),
    x_residency: str.optional(),
    picture: str.nullable().optional(), // data URL, localStorage only
  })
  .passthrough()

export const WorkSchema = z
  .object({
    name: str.optional(), // company
    position: str.optional(),
    location: str.optional(),
    url: str.optional(),
    startDate: str.optional(),
    endDate: str.optional(),
    summary: str.optional(),
    highlights: z.array(str).optional(),
  })
  .passthrough()

export const EducationSchema = z
  .object({
    institution: str.optional(),
    area: str.optional(),
    studyType: str.optional(),
    startDate: str.optional(),
    endDate: str.optional(),
  })
  .passthrough()

export const CertificateSchema = z
  .object({
    name: str.optional(),
    date: str.optional(),
    issuer: str.optional(),
  })
  .passthrough()

export const AwardSchema = z
  .object({
    title: str.optional(),
    date: str.optional(),
    awarder: str.optional(),
    summary: str.optional(),
  })
  .passthrough()

export const LanguageSchema = z
  .object({
    language: str.optional(),
    fluency: str.optional(),
  })
  .passthrough()

export const AdvisorySchema = z
  .object({
    role: str.optional(),
    organization: str.optional(),
    startDate: str.optional(),
    endDate: str.optional(),
  })
  .passthrough()

export const MembershipSchema = z
  .object({
    organization: str.optional(),
    since: str.optional(),
  })
  .passthrough()

export const ResumeSchema = z
  .object({
    basics: BasicsSchema.optional(),
    work: z.array(WorkSchema).optional(),
    education: z.array(EducationSchema).optional(),
    certificates: z.array(CertificateSchema).optional(),
    awards: z.array(AwardSchema).optional(),
    languages: z.array(LanguageSchema).optional(),
    // Extensions
    x_coreCompetence: z.array(str).optional(),
    x_advisory: z.array(AdvisorySchema).optional(),
    x_portfolio: z.array(str).optional(),
    x_memberships: z.array(MembershipSchema).optional(),
    meta: z.object({ template: str.optional() }).passthrough().optional(),
  })
  .passthrough()

export type Resume = z.infer<typeof ResumeSchema>
export type Basics = z.infer<typeof BasicsSchema>
export type WorkItem = z.infer<typeof WorkSchema>

/** Validate an imported resume; returns friendly error strings on failure. */
export function validateResume(data: unknown): { resume?: Resume; errors?: string[] } {
  const result = ResumeSchema.safeParse(data)
  if (result.success) return { resume: result.data }
  return {
    errors: result.error.issues.map(
      (i) => `${i.path.length ? '/' + i.path.join('/') : '(root)'}: ${i.message}`,
    ),
  }
}
