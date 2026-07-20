import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from '@react-pdf/renderer'
import { Resume } from '../schema/resume'

// Berlin Blue recreated in react-pdf primitives. A4, full-bleed navy sidebar
// repeated on every page (a `fixed` band painted behind a two-column row),
// letter-spaced caps headers, serif-italic display name. Content flows to N
// pages; react-pdf never clips, so ±content just adds/removes pages.

const NAVY = '#325283'
const NAVY_TEXT = '#335384'
const STEEL = '#4d9fd2'
const BODY = '#3f3f3d'
const TITLE = '#2b2b2b'
const SIDE_TEXT = '#f2f5fa'
const SIDE_MUTED = '#cfdaea'

const SIDEBAR_W = '34%'

const s = StyleSheet.create({
  page: {
    fontFamily: 'SourceSans3',
    fontSize: 9.6,
    color: BODY,
    lineHeight: 1.5,
    flexDirection: 'row',
  },
  band: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: SIDEBAR_W,
    backgroundColor: NAVY,
  },
  sideCol: {
    width: SIDEBAR_W,
    paddingTop: 28,
    paddingBottom: 22,
    paddingHorizontal: 20,
    color: SIDE_TEXT,
  },
  mainCol: {
    width: '66%',
    paddingTop: 34,
    paddingRight: 30,
    paddingBottom: 28,
    paddingLeft: 26,
  },

  // sidebar
  photoWrap: { alignItems: 'center', marginBottom: 22 },
  photo: {
    width: 130,
    height: 130,
    borderRadius: 65,
    objectFit: 'cover',
    border: '3pt solid #ffffff',
  },
  photoPlaceholder: {
    width: 130,
    height: 130,
    borderRadius: 65,
    border: '3pt solid #ffffff',
    backgroundColor: '#46618f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoInitials: { color: '#fff', fontSize: 44, fontWeight: 700 },
  sideH: {
    color: '#fff',
    fontSize: 10.5,
    fontWeight: 700,
    letterSpacing: 2.6,
    textTransform: 'uppercase',
    marginTop: 12,
    marginBottom: 8,
  },
  aboutRow: { flexDirection: 'row', marginBottom: 7, color: SIDE_TEXT },
  aboutMarker: { color: STEEL, marginRight: 6, fontSize: 8.3 },
  aboutText: { fontSize: 8.3, lineHeight: 1.4, flex: 1 },
  sideLi: { flexDirection: 'row', marginBottom: 6, color: '#fff' },
  sideLiDot: { color: '#fff', marginRight: 6, fontSize: 10.3 },
  sideLiText: { fontSize: 10.3, lineHeight: 1.35, flex: 1, color: '#fff' },
  sideItem: { flexDirection: 'row', marginBottom: 7, color: SIDE_TEXT },
  sideItemMarker: { color: SIDE_MUTED, marginRight: 6, fontSize: 8.3 },
  sideItemText: { fontSize: 8.3, lineHeight: 1.45, flex: 1 },
  advisory: {
    fontSize: 9,
    letterSpacing: 1.4,
    lineHeight: 1.6,
    color: '#fff',
    marginBottom: 6,
  },

  // main
  name: {
    fontFamily: 'SourceSerif4',
    fontStyle: 'italic',
    fontWeight: 700,
    fontSize: 32,
    lineHeight: 1.2,
    color: NAVY_TEXT,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  nameRule: {
    width: 48,
    borderBottomWidth: 2,
    borderBottomColor: NAVY_TEXT,
    marginTop: 6,
    marginBottom: 24,
  },
  role: {
    color: STEEL,
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 3,
    textTransform: 'uppercase',
    lineHeight: 1.5,
    marginBottom: 16,
  },
  mainH: {
    color: STEEL,
    fontSize: 10.5,
    fontWeight: 700,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: 10,
    marginBottom: 7,
  },
  para: { fontSize: 9.6, lineHeight: 1.5, marginBottom: 9 },
  subhead: { fontSize: 9.8, fontWeight: 700, color: TITLE, marginTop: 3, marginBottom: 4 },
  hlRow: { flexDirection: 'row', marginBottom: 3.5 },
  hlDot: { marginRight: 5 },
  hlText: { fontSize: 9.6, lineHeight: 1.5, flex: 1 },
  workTitle: { fontSize: 10.2, fontWeight: 700, color: TITLE, lineHeight: 1.4, marginTop: 6 },
  workCo: { fontSize: 10.2, fontWeight: 700, color: TITLE, lineHeight: 1.4, marginBottom: 5 },
  liRow: { flexDirection: 'row', marginBottom: 4, paddingLeft: 4 },
  liDot: { marginRight: 6 },
  liText: { fontSize: 9.6, lineHeight: 1.55, flex: 1 },
})

// Keep a section heading with what follows: react-pdf pushes the heading to the
// next page unless at least this many points remain below it (enough for its
// first item), so headings never sit orphaned at the bottom of a column.
const KEEP_SIDE = 34
const KEEP_MAIN = 48

function joined(parts: Array<string | undefined>, sep: string): string {
  return parts.filter((p) => p && String(p).trim()).join(sep)
}

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('') || '?'
  )
}

function Sidebar({ resume }: { resume: Resume }) {
  const b = resume.basics ?? {}
  const loc = b.location ?? {}
  const linkedin = (b.profiles ?? []).find(
    (p) => (p.network ?? '').toLowerCase() === 'linkedin',
  )
  const langs = (resume.languages ?? []).map((l) => l.language).filter(Boolean).join(', ')
  const addr1 = loc.address
  const addr2 = joined([joined([loc.postalCode, loc.city], ' '), loc.region], ', ')

  const about: string[] = []
  if (addr1 || addr2) about.push(joined([addr1, addr2], ', '))
  if (b.email) about.push(b.email)
  if (linkedin?.username) about.push(`@${linkedin.username}`)
  else if (linkedin?.url) about.push(linkedin.url)
  if (b.phone) about.push(b.phone)
  if (langs) about.push(langs)
  if (b.x_residency) about.push(b.x_residency)
  if (b.x_birthDate) about.push(b.x_birthDate)

  return (
    <View style={s.sideCol}>
      <View style={s.photoWrap}>
        {b.picture ? (
          // eslint-disable-next-line jsx-a11y/alt-text
          <Image style={s.photo} src={b.picture} />
        ) : (
          <View style={s.photoPlaceholder}>
            <Text style={s.photoInitials}>{initials(b.name ?? '')}</Text>
          </View>
        )}
      </View>

      <Text style={s.sideH} minPresenceAhead={KEEP_SIDE}>
        About me
      </Text>
      {about.map((line, i) => (
        <View style={s.aboutRow} key={i} wrap={false}>
          <Text style={s.aboutMarker}>•</Text>
          <Text style={s.aboutText}>{line}</Text>
        </View>
      ))}

      <SideList title="Core competence" items={resume.x_coreCompetence ?? []} variant="bullet" />

      {(resume.x_advisory ?? []).length > 0 && (
        <>
          <Text style={s.sideH} minPresenceAhead={KEEP_SIDE}>
            Advisory
          </Text>
          {(resume.x_advisory ?? []).map((a, i) => (
            <Text style={s.advisory} key={i} wrap={false}>
              {joined([a.role, a.organization], ', ')}
              {a.startDate || a.endDate ? ` | ${joined([a.startDate, a.endDate], ' – ')}` : ''}
            </Text>
          ))}
        </>
      )}

      <SideList
        title="Kudos received"
        items={(resume.awards ?? []).map((a) =>
          joined([a.title, a.awarder ? `(${a.awarder})` : undefined], ' '),
        )}
        variant="item"
      />
      <SideList title="Product portfolio" items={resume.x_portfolio ?? []} variant="item" />
      <SideList
        title="Education"
        items={(resume.education ?? []).map((e) =>
          joined(
            [
              joined([e.studyType, e.area], ' '),
              e.startDate || e.endDate ? `(${joined([e.startDate, e.endDate], ' - ')})` : undefined,
              e.institution,
            ],
            ' ',
          ),
        )}
        variant="item"
      />
      <SideList
        title="Certifications"
        items={(resume.certificates ?? []).map((c) =>
          joined([c.name, joined([c.issuer, c.date], ' ') ? `(${joined([c.issuer, c.date], ' ')})` : undefined], ' '),
        )}
        variant="item"
      />
      <SideList
        title="Active membership"
        items={(resume.x_memberships ?? []).map((m) =>
          joined([m.organization, m.since ? `(${m.since})` : undefined], ' '),
        )}
        variant="item"
      />
    </View>
  )
}

function SideList({
  title,
  items,
  variant,
}: {
  title: string
  items: string[]
  variant: 'bullet' | 'item'
}) {
  const list = items.filter((x) => x && x.trim())
  if (list.length === 0) return null
  return (
    <>
      <Text style={s.sideH} minPresenceAhead={KEEP_SIDE}>
        {title}
      </Text>
      {list.map((it, i) =>
        variant === 'bullet' ? (
          <View style={s.sideLi} key={i} wrap={false}>
            <Text style={s.sideLiDot}>•</Text>
            <Text style={s.sideLiText}>{it}</Text>
          </View>
        ) : (
          <View style={s.sideItem} key={i} wrap={false}>
            <Text style={s.sideItemMarker}>▪</Text>
            <Text style={s.sideItemText}>{it}</Text>
          </View>
        ),
      )}
    </>
  )
}

function Main({ resume }: { resume: Resume }) {
  const b = resume.basics ?? {}
  const summary = b.summary ?? []
  const highlights = b.x_highlights ?? []
  const work = resume.work ?? []

  return (
    <View style={s.mainCol}>
      <View wrap={false}>
        <Text style={s.name}>{b.name || 'Your Name'}</Text>
        <View style={s.nameRule} />
      </View>
      {b.label ? <Text style={s.role}>{b.label}</Text> : null}

      {summary.length > 0 && (
        <>
          <Text style={s.mainH} minPresenceAhead={KEEP_MAIN}>
            Summary
          </Text>
          {summary.map((p, i) => (
            <Text style={s.para} key={i}>
              {p}
            </Text>
          ))}
        </>
      )}

      {highlights.length > 0 && (
        <>
          <Text style={s.subhead} minPresenceAhead={KEEP_MAIN}>
            Highlights
          </Text>
          {highlights.map((h, i) => (
            <View style={s.hlRow} key={i}>
              <Text style={s.hlDot}>•</Text>
              <Text style={s.hlText}>{h}</Text>
            </View>
          ))}
        </>
      )}

      {work.length > 0 && (
        <>
          <Text style={s.mainH} minPresenceAhead={KEEP_MAIN}>
            Work experience
          </Text>
          {work.map((w, i) => (
            <View key={i}>
              <View wrap={false}>
                {w.position ? <Text style={s.workTitle}>{w.position}</Text> : null}
                <Text style={s.workCo}>
                  {joined([w.name, joined([w.startDate, w.endDate], ' – ')], ' | ')}
                </Text>
              </View>
              {(w.highlights ?? []).map((h, j) => (
                <View style={s.liRow} key={j} wrap={false}>
                  <Text style={s.liDot}>•</Text>
                  <Text style={s.liText}>{h}</Text>
                </View>
              ))}
            </View>
          ))}
        </>
      )}
    </View>
  )
}

export function BerlinBlueDocument({ resume }: { resume: Resume }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View fixed style={s.band} />
        <Sidebar resume={resume} />
        <Main resume={resume} />
      </Page>
    </Document>
  )
}
