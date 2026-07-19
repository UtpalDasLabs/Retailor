import { useLayoutEffect, useRef, useState } from 'react'
import { Resume } from '../../schema/resume'
import { TemplateProps } from '../registry'
import { Block, pack } from '../paginate'
import {
  BookIcon,
  BookmarkIcon,
  CakeIcon,
  CheckCircleIcon,
  GlobeIcon,
  GradCapIcon,
  LinkedInIcon,
  MailIcon,
  MapPinIcon,
  PeopleIcon,
  PhoneIcon,
} from './icons'
import './berlin-blue.css'

// Vertical paddings in mm — must match .bb-side-inner / .bb-main-inner CSS.
const SIDE_PAD_V = 10 + 8
const MAIN_PAD_V = 12 + 10
const PAGE_H_MM = 297

function joined(parts: Array<string | undefined>, sep: string): string {
  return parts.filter((p) => p && p.trim()).join(sep)
}

function buildSidebarBlocks(resume: Resume): Block[] {
  const b = resume.basics ?? {}
  const loc = b.location ?? {}
  const blocks: Block[] = []

  const initials = (b.name ?? '')
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
  blocks.push({
    key: 'photo',
    node: (
      <div className="bb-photo-wrap">
        {b.picture ? (
          <img className="bb-photo" src={b.picture} alt="" />
        ) : (
          <div className="bb-photo-placeholder">{initials || '?'}</div>
        )}
      </div>
    ),
  })

  blocks.push({
    key: 'about-h',
    node: <div className="bb-side-h">About me</div>,
    keepWithNext: true,
  })
  const addr1 = loc.address
  const addr2 = joined([joined([loc.postalCode, loc.city], ' '), loc.region], ', ')
  if (addr1 || addr2) {
    blocks.push({
      key: 'about-addr',
      node: (
        <div className="bb-about-row">
          <MapPinIcon />
          <span>
            {addr1}
            {addr1 && addr2 ? <br /> : null}
            {addr2}
          </span>
        </div>
      ),
    })
  }
  if (b.email)
    blocks.push({
      key: 'about-email',
      node: (
        <div className="bb-about-row">
          <MailIcon />
          <span>{b.email}</span>
        </div>
      ),
    })
  const linkedin = (b.profiles ?? []).find(
    (p) => (p.network ?? '').toLowerCase() === 'linkedin',
  )
  if (linkedin?.username || linkedin?.url)
    blocks.push({
      key: 'about-li',
      node: (
        <div className="bb-about-row">
          <LinkedInIcon />
          <span>{linkedin.username ? `@${linkedin.username}` : linkedin.url}</span>
        </div>
      ),
    })
  if (b.phone)
    blocks.push({
      key: 'about-phone',
      node: (
        <div className="bb-about-row">
          <PhoneIcon />
          <span>{b.phone}</span>
        </div>
      ),
    })
  const langs = (resume.languages ?? [])
    .map((l) => l.language)
    .filter(Boolean)
    .join(', ')
  if (langs)
    blocks.push({
      key: 'about-langs',
      node: (
        <div className="bb-about-row">
          <BookIcon />
          <span>{langs}</span>
        </div>
      ),
    })
  if (b.x_residency)
    blocks.push({
      key: 'about-res',
      node: (
        <div className="bb-about-row">
          <GlobeIcon />
          <span>{b.x_residency}</span>
        </div>
      ),
    })
  if (b.x_birthDate)
    blocks.push({
      key: 'about-birth',
      node: (
        <div className="bb-about-row">
          <CakeIcon />
          <span>{b.x_birthDate}</span>
        </div>
      ),
    })

  const core = resume.x_coreCompetence ?? []
  if (core.length) {
    blocks.push({
      key: 'core-h',
      node: <div className="bb-side-h">Core competence</div>,
      keepWithNext: true,
    })
    core.forEach((c, i) =>
      blocks.push({
        key: `core-${i}`,
        node: (
          <div className="bb-side-li">
            <span>{c}</span>
          </div>
        ),
      }),
    )
  }

  const advisory = resume.x_advisory ?? []
  if (advisory.length) {
    blocks.push({
      key: 'adv-h',
      node: <div className="bb-side-h">Advisory</div>,
      keepWithNext: true,
    })
    advisory.forEach((a, i) =>
      blocks.push({
        key: `adv-${i}`,
        node: (
          <div className="bb-advisory">
            {joined([a.role, a.organization], ', ')}
            {a.startDate || a.endDate
              ? ` | ${joined([a.startDate, a.endDate], ' – ')}`
              : null}
          </div>
        ),
      }),
    )
  }

  const awards = resume.awards ?? []
  if (awards.length) {
    blocks.push({
      key: 'kudos-h',
      node: <div className="bb-side-h">Kudos received</div>,
      keepWithNext: true,
    })
    awards.forEach((a, i) =>
      blocks.push({
        key: `kudos-${i}`,
        node: (
          <div className="bb-side-item">
            <BookmarkIcon />
            <span>{joined([a.title, a.awarder ? `(${a.awarder})` : undefined], ' ')}</span>
          </div>
        ),
      }),
    )
  }

  const portfolio = resume.x_portfolio ?? []
  if (portfolio.length) {
    blocks.push({
      key: 'pf-h',
      node: <div className="bb-side-h">Product portfolio</div>,
      keepWithNext: true,
    })
    portfolio.forEach((p, i) =>
      blocks.push({
        key: `pf-${i}`,
        node: (
          <div className="bb-side-item">
            <CheckCircleIcon />
            <span>{p}</span>
          </div>
        ),
      }),
    )
  }

  const education = resume.education ?? []
  if (education.length) {
    blocks.push({
      key: 'edu-h',
      node: <div className="bb-side-h">Education</div>,
      keepWithNext: true,
    })
    education.forEach((e, i) =>
      blocks.push({
        key: `edu-${i}`,
        node: (
          <div className="bb-side-item">
            <GradCapIcon />
            <span>
              {joined(
                [
                  joined([e.studyType, e.area], ' '),
                  e.startDate || e.endDate
                    ? `(${joined([e.startDate, e.endDate], ' - ')})`
                    : undefined,
                  e.institution,
                ],
                ' ',
              )}
            </span>
          </div>
        ),
      }),
    )
  }

  const certs = resume.certificates ?? []
  if (certs.length) {
    blocks.push({
      key: 'cert-h',
      node: <div className="bb-side-h">Certifications</div>,
      keepWithNext: true,
    })
    certs.forEach((c, i) =>
      blocks.push({
        key: `cert-${i}`,
        node: (
          <div className="bb-side-item">
            <BookmarkIcon />
            <span>
              {joined(
                [c.name, c.issuer ? `(${c.issuer}` : undefined],
                ' ',
              )}
              {c.issuer && c.date ? ` ${c.date})` : c.issuer ? ')' : c.date ? ` (${c.date})` : ''}
            </span>
          </div>
        ),
      }),
    )
  }

  const memberships = resume.x_memberships ?? []
  if (memberships.length) {
    blocks.push({
      key: 'mem-h',
      node: <div className="bb-side-h">Active membership</div>,
      keepWithNext: true,
    })
    memberships.forEach((m, i) =>
      blocks.push({
        key: `mem-${i}`,
        node: (
          <div className="bb-side-item">
            <PeopleIcon />
            <span>
              {m.organization}
              {m.since ? ` ( ${m.since} )` : ''}
            </span>
          </div>
        ),
      }),
    )
  }

  return blocks
}

function buildMainBlocks(resume: Resume): Block[] {
  const b = resume.basics ?? {}
  const blocks: Block[] = []

  blocks.push({
    key: 'name',
    node: (
      <div>
        <div className="bb-name">{b.name ?? 'Your Name'}</div>
        <div className="bb-name-rule" />
      </div>
    ),
    keepWithNext: true,
  })
  if (b.label)
    blocks.push({
      key: 'role',
      node: <div className="bb-role">{b.label}</div>,
    })

  const summary = b.summary ?? []
  if (summary.length) {
    blocks.push({
      key: 'sum-h',
      node: <div className="bb-main-h">Summary</div>,
      keepWithNext: true,
    })
    summary.forEach((p, i) =>
      blocks.push({ key: `sum-${i}`, node: <div className="bb-para">{p}</div> }),
    )
  }

  const highlights = b.x_highlights ?? []
  if (highlights.length) {
    blocks.push({
      key: 'hl-h',
      node: <div className="bb-subhead">Highlights</div>,
      keepWithNext: true,
    })
    highlights.forEach((h, i) =>
      blocks.push({ key: `hl-${i}`, node: <div className="bb-hl">{h}</div> }),
    )
  }

  const work = resume.work ?? []
  if (work.length) {
    blocks.push({
      key: 'work-h',
      node: <div className="bb-main-h">Work experience</div>,
      keepWithNext: true,
    })
    work.forEach((w, i) => {
      blocks.push({
        key: `w${i}-t`,
        node: (
          <div>
            {w.position ? <div className="bb-work-title">{w.position}</div> : null}
            <div className="bb-work-co">
              {joined(
                [w.name, joined([w.startDate, w.endDate], ' – ')],
                ' | ',
              )}
            </div>
          </div>
        ),
        keepWithNext: true,
      })
      ;(w.highlights ?? []).forEach((h, j) =>
        blocks.push({
          key: `w${i}-h${j}`,
          node: (
            <div className="bb-li">
              <span>{h}</span>
            </div>
          ),
        }),
      )
    })
  }

  return blocks
}

interface Layout {
  sidebar: number[][]
  main: number[][]
}

export function BerlinBlue({ resume }: TemplateProps) {
  const sidebarBlocks = buildSidebarBlocks(resume)
  const mainBlocks = buildMainBlocks(resume)

  const measureRef = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState<Layout | null>(null)
  const [fontsReady, setFontsReady] = useState(false)

  useLayoutEffect(() => {
    let cancelled = false
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!cancelled) setFontsReady(true)
      })
    } else {
      setFontsReady(true)
    }
    return () => {
      cancelled = true
    }
  }, [])

  useLayoutEffect(() => {
    const root = measureRef.current
    if (!root) return
    const probe = root.querySelector('.bb-hprobe') as HTMLElement
    const mmToPx = probe.offsetHeight / PAGE_H_MM
    const sideEls = Array.from(root.querySelectorAll('.bb-mside > .bb-block'))
    const mainEls = Array.from(root.querySelectorAll('.bb-mmain > .bb-block'))
    // Fractional heights (getBoundingClientRect) — offsetHeight rounds down,
    // and the accumulated error overfills pages. Small buffer for safety.
    const heights = (els: Element[]) => els.map((el) => el.getBoundingClientRect().height)
    const SAFETY = 4
    const sideCap = (PAGE_H_MM - SIDE_PAD_V) * mmToPx - SAFETY
    const mainCap = (PAGE_H_MM - MAIN_PAD_V) * mmToPx - SAFETY
    setLayout({
      sidebar: pack(
        heights(sideEls),
        sidebarBlocks.map((blk) => !!blk.keepWithNext),
        sideCap,
      ),
      main: pack(
        heights(mainEls),
        mainBlocks.map((blk) => !!blk.keepWithNext),
        mainCap,
      ),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resume, fontsReady])

  const pageCount = layout ? Math.max(layout.sidebar.length, layout.main.length) : 0

  return (
    <>
      {/* Measurement pass: same markup at exact print width, offscreen */}
      <div className="bb-measure" ref={measureRef} aria-hidden>
        <div className="bb-hprobe" style={{ height: '297mm', width: 0 }} />
        <div className="bb-page">
          <div className="bb-sidebar">
            <div className="bb-side-inner bb-mside">
              {sidebarBlocks.map((blk) => (
                <div className="bb-block" key={blk.key}>
                  {blk.node}
                </div>
              ))}
            </div>
          </div>
          <div className="bb-main-col">
            <div className="bb-main-inner bb-mmain">
              {mainBlocks.map((blk) => (
                <div className="bb-block" key={blk.key}>
                  {blk.node}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {layout &&
        Array.from({ length: pageCount }, (_, p) => (
          <div className="bb-page cv-page" key={p}>
            <div className="bb-sidebar">
              <div className="bb-side-inner">
                {(layout.sidebar[p] ?? []).map((i) => (
                  <div className="bb-block" key={sidebarBlocks[i].key}>
                    {sidebarBlocks[i].node}
                  </div>
                ))}
              </div>
            </div>
            <div className="bb-main-col">
              <div className="bb-main-inner">
                {(layout.main[p] ?? []).map((i) => (
                  <div className="bb-block" key={mainBlocks[i].key}>
                    {mainBlocks[i].node}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
    </>
  )
}
