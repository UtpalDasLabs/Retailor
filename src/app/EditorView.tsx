import { useRef } from 'react'
import { Resume } from '../schema/resume'
import { readImageAsDataUrl } from '../storage/local'
import { setIn } from './setIn'
import { ObjectListEditor, StringListEditor, TextField } from './fields'

export function EditorView({
  resume,
  onChange,
  onToast,
}: {
  resume: Resume
  onChange: (r: Resume) => void
  onToast: (msg: string) => void
}) {
  const photoInput = useRef<HTMLInputElement>(null)
  const b = resume.basics ?? {}
  const loc = b.location ?? {}
  const set = (path: (string | number)[], value: unknown) =>
    onChange(setIn(resume, path, value))

  const linkedinIdx = (b.profiles ?? []).findIndex(
    (p) => (p.network ?? '').toLowerCase() === 'linkedin',
  )
  const linkedin = linkedinIdx >= 0 ? (b.profiles ?? [])[linkedinIdx] : undefined

  return (
    <div className="ed-grid">
      <details className="card" open>
        <summary>Basics</summary>
        <div className="photo-row">
          {b.picture ? (
            <img className="photo-thumb" src={b.picture} alt="Profile photo" />
          ) : (
            <div className="photo-thumb-empty">no photo</div>
          )}
          <div>
            <input
              ref={photoInput}
              className="visually-hidden"
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                try {
                  const dataUrl = await readImageAsDataUrl(file)
                  set(['basics', 'picture'], dataUrl)
                  onToast('Photo stored in this browser only — it never leaves localStorage.')
                } catch {
                  onToast('Could not read that image.')
                }
                e.target.value = ''
              }}
            />
            <button type="button" className="btn btn-sm" onClick={() => photoInput.current?.click()}>
              Upload photo
            </button>{' '}
            {b.picture ? (
              <button
                type="button"
                className="btn btn-sm btn-danger"
                onClick={() => set(['basics', 'picture'], null)}
              >
                Remove photo
              </button>
            ) : null}
            <div className="hint">Optional. Stored as a data URL in localStorage only.</div>
          </div>
        </div>
        <div className="field-row">
          <TextField label="Full name" value={b.name ?? ''} onChange={(v) => set(['basics', 'name'], v)} />
          <TextField label="Role label" value={b.label ?? ''} onChange={(v) => set(['basics', 'label'], v)} />
          <TextField label="Email" value={b.email ?? ''} onChange={(v) => set(['basics', 'email'], v)} />
          <TextField label="Phone" value={b.phone ?? ''} onChange={(v) => set(['basics', 'phone'], v)} />
          <TextField
            label="LinkedIn username"
            value={linkedin?.username ?? ''}
            onChange={(v) => {
              if (linkedinIdx >= 0) set(['basics', 'profiles', linkedinIdx, 'username'], v)
              else
                set(
                  ['basics', 'profiles'],
                  [...(b.profiles ?? []), { network: 'LinkedIn', username: v }],
                )
            }}
          />
          <TextField label="Website" value={b.url ?? ''} onChange={(v) => set(['basics', 'url'], v)} />
          <TextField
            label="Street address"
            value={loc.address ?? ''}
            onChange={(v) => set(['basics', 'location', 'address'], v)}
          />
          <TextField
            label="Postal code"
            value={loc.postalCode ?? ''}
            onChange={(v) => set(['basics', 'location', 'postalCode'], v)}
          />
          <TextField label="City" value={loc.city ?? ''} onChange={(v) => set(['basics', 'location', 'city'], v)} />
          <TextField
            label="Country code"
            value={loc.countryCode ?? ''}
            onChange={(v) => set(['basics', 'location', 'countryCode'], v)}
          />
          <TextField
            label="Birth date"
            value={b.x_birthDate ?? ''}
            onChange={(v) => set(['basics', 'x_birthDate'], v)}
          />
          <TextField
            label="Residency"
            value={b.x_residency ?? ''}
            onChange={(v) => set(['basics', 'x_residency'], v)}
          />
        </div>
      </details>

      <details className="card" open>
        <summary>Summary paragraphs</summary>
        <StringListEditor
          items={b.summary ?? []}
          rows={3}
          addLabel="Add paragraph"
          onChange={(items) => set(['basics', 'summary'], items)}
        />
      </details>

      <details className="card">
        <summary>Highlights</summary>
        <StringListEditor
          items={b.x_highlights ?? []}
          addLabel="Add highlight"
          onChange={(items) => set(['basics', 'x_highlights'], items)}
        />
      </details>

      <details className="card">
        <summary>Work experience</summary>
        <ObjectListEditor
          items={resume.work ?? []}
          onChange={(items) => set(['work'], items)}
          addLabel="Add position"
          fields={[
            { key: 'position', label: 'Role title' },
            { key: 'name', label: 'Company' },
            { key: 'startDate', label: 'Start date' },
            { key: 'endDate', label: 'End date' },
          ]}
          makeNew={() => ({ position: '', name: '', startDate: '', endDate: '', highlights: [] })}
          renderExtra={(item, update) => (
            <div className="field">
              <span className="field-label">Highlights</span>
              <StringListEditor
                items={(item.highlights as string[] | undefined) ?? []}
                addLabel="Add bullet"
                onChange={(hs) => update({ highlights: hs } as never)}
              />
            </div>
          )}
        />
      </details>

      <details className="card">
        <summary>Core competence</summary>
        <StringListEditor
          items={resume.x_coreCompetence ?? []}
          rows={1}
          addLabel="Add competence"
          onChange={(items) => set(['x_coreCompetence'], items)}
        />
      </details>

      <details className="card">
        <summary>Languages</summary>
        <ObjectListEditor
          items={resume.languages ?? []}
          onChange={(items) => set(['languages'], items)}
          addLabel="Add language"
          fields={[
            { key: 'language', label: 'Language' },
            { key: 'fluency', label: 'Fluency' },
          ]}
          makeNew={() => ({ language: '', fluency: '' })}
        />
      </details>

      <details className="card">
        <summary>Advisory</summary>
        <ObjectListEditor
          items={resume.x_advisory ?? []}
          onChange={(items) => set(['x_advisory'], items)}
          addLabel="Add advisory role"
          fields={[
            { key: 'role', label: 'Role' },
            { key: 'organization', label: 'Organization' },
            { key: 'startDate', label: 'Start date' },
            { key: 'endDate', label: 'End date' },
          ]}
          makeNew={() => ({ role: '', organization: '', startDate: '', endDate: '' })}
        />
      </details>

      <details className="card">
        <summary>Kudos received (awards)</summary>
        <ObjectListEditor
          items={resume.awards ?? []}
          onChange={(items) => set(['awards'], items)}
          addLabel="Add award"
          fields={[
            { key: 'title', label: 'Title', textarea: true },
            { key: 'awarder', label: 'Awarded by' },
          ]}
          makeNew={() => ({ title: '', awarder: '' })}
        />
      </details>

      <details className="card">
        <summary>Product portfolio</summary>
        <StringListEditor
          items={resume.x_portfolio ?? []}
          rows={1}
          addLabel="Add product"
          onChange={(items) => set(['x_portfolio'], items)}
        />
      </details>

      <details className="card">
        <summary>Education</summary>
        <ObjectListEditor
          items={resume.education ?? []}
          onChange={(items) => set(['education'], items)}
          addLabel="Add education"
          fields={[
            { key: 'institution', label: 'Institution' },
            { key: 'area', label: 'Field of study' },
            { key: 'studyType', label: 'Degree' },
            { key: 'startDate', label: 'Start year' },
            { key: 'endDate', label: 'End year' },
          ]}
          makeNew={() => ({ institution: '', area: '', studyType: '', startDate: '', endDate: '' })}
        />
      </details>

      <details className="card">
        <summary>Certifications</summary>
        <ObjectListEditor
          items={resume.certificates ?? []}
          onChange={(items) => set(['certificates'], items)}
          addLabel="Add certification"
          fields={[
            { key: 'name', label: 'Name' },
            { key: 'issuer', label: 'Issuer' },
            { key: 'date', label: 'Year' },
          ]}
          makeNew={() => ({ name: '', issuer: '', date: '' })}
        />
      </details>

      <details className="card">
        <summary>Active membership</summary>
        <ObjectListEditor
          items={resume.x_memberships ?? []}
          onChange={(items) => set(['x_memberships'], items)}
          addLabel="Add membership"
          fields={[
            { key: 'organization', label: 'Organization' },
            { key: 'since', label: 'Since' },
          ]}
          makeNew={() => ({ organization: '', since: '' })}
        />
      </details>
    </div>
  )
}
