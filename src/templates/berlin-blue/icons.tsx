// Inline SVG glyphs for the sidebar — no external requests, ever.

interface IconProps {
  size?: number
}

function svgProps(size: number) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'currentColor',
    'aria-hidden': true as const,
  }
}

export function MapPinIcon({ size = 13 }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
    </svg>
  )
}

export function MailIcon({ size = 13 }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <path d="M2 5h20v14H2V5zm10 6.5L4 6.7v10.6h16V6.7l-8 4.8zM4.9 6.5h14.2L12 10.8 4.9 6.5z" />
    </svg>
  )
}

export function LinkedInIcon({ size = 13 }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <path d="M3 3h18v18H3V3zm5.2 13.9V10H5.9v6.9h2.3zM7 9a1.3 1.3 0 1 0 0-2.7A1.3 1.3 0 0 0 7 9zm11 7.9v-3.9c0-2.1-1.1-3.1-2.6-3.1-1.2 0-1.8.7-2.1 1.2V10H11c0 .6 0 6.9 0 6.9h2.3v-3.9c0-.2 0-.4.1-.6.2-.4.5-.8 1.2-.8.8 0 1.1.6 1.1 1.5v3.8H18z" />
    </svg>
  )
}

export function PhoneIcon({ size = 13 }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <path d="M6.6 10.8a15.7 15.7 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.4.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z" />
    </svg>
  )
}

export function BookIcon({ size = 13 }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <path d="M21 4.5v13.9c-1.2-.5-2.6-.7-3.9-.7-1.6 0-3.9.6-5.1 1.5V5.5C10.7 4.6 8.4 4 6.9 4 5.5 4 4.1 4.2 3 4.7v14c0-.1 3-.9 3.9-.9 1.6 0 3.9.6 5.1 1.5 1.2-.9 3.5-1.5 5.1-1.5 1.3 0 2.7.2 3.9.8V4.5h.1zM12 6.6c1.5-.8 3.5-1.2 5.1-1.2.9 0 1.9.1 2.9.4v11c-1-.3-2-.4-2.9-.4-1.6 0-3.6.4-5.1 1.2V6.6z" />
    </svg>
  )
}

export function GlobeIcon({ size = 13 }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm7 6h-3a15 15 0 0 0-1.4-3.6A8 8 0 0 1 19 8zM12 4c.8 1.2 1.5 2.5 1.9 4h-3.8c.4-1.5 1.1-2.8 1.9-4zM4.3 14a8.2 8.2 0 0 1 0-4h3.4a16.6 16.6 0 0 0 0 4H4.3zm.7 2h3a15 15 0 0 0 1.4 3.6A8 8 0 0 1 5 16zm3-8H5a8 8 0 0 1 4.4-3.6A15 15 0 0 0 8 8zm4 12c-.8-1.2-1.5-2.5-1.9-4h3.8a13.8 13.8 0 0 1-1.9 4zm2.3-6H9.7a14.6 14.6 0 0 1 0-4h4.6a14.6 14.6 0 0 1 0 4zm.3 5.6A15 15 0 0 0 16 16h3a8 8 0 0 1-4.4 3.6zM16.3 14a16.6 16.6 0 0 0 0-4h3.4a8.2 8.2 0 0 1 0 4h-3.4z" />
    </svg>
  )
}

export function CakeIcon({ size = 13 }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <path d="M12 6a2 2 0 0 0 2-2c0-.4-.1-.7-.3-1L12 0l-1.7 3a2 2 0 0 0 1.7 3zm4.6 10-1.1-1-1.1 1c-1.3 1.3-3.6 1.3-4.9 0l-1-1-1.1 1c-.6.7-1.5 1-2.4 1-.7 0-1.4-.2-2-.6V20c0 .6.4 1 1 1h16c.6 0 1-.4 1-1v-3.6c-.6.4-1.3.6-2 .6-.9 0-1.8-.3-2.4-1zM17 9h-4V7h-2v2H7a3 3 0 0 0-3 3v1.5c0 .8.7 1.5 1.5 1.5.4 0 .8-.1 1-.4l2.1-2.1 2.1 2.1c.6.6 1.6.6 2.2 0l2.1-2.1 2.1 2.1c.3.3.7.4 1 .4.8 0 1.5-.7 1.5-1.5V12a3 3 0 0 0-2.6-3z" />
    </svg>
  )
}

export function BookmarkIcon({ size = 13 }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <path d="M6 2h12a1 1 0 0 1 1 1v19l-7-4.4L5 22V3a1 1 0 0 1 1-1z" />
    </svg>
  )
}

export function CheckCircleIcon({ size = 13 }: IconProps) {
  return (
    <svg {...svgProps(size)} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.5 2.7 2.7L16.5 9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function GradCapIcon({ size = 13 }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <path d="M12 3 1 9l11 6 9-4.9V17h2V9L12 3zM5 13.2V17c0 1.7 3.1 3 7 3s7-1.3 7-3v-3.8l-7 3.8-7-3.8z" />
    </svg>
  )
}

export function PeopleIcon({ size = 13 }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <path d="M16 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm-8 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm0 2c-2.3 0-7 1.2-7 3.5V19h14v-2.5C15 14.2 10.3 13 8 13zm8 0c-.3 0-.6 0-1 .1a4.2 4.2 0 0 1 2 3.4V19h6v-2.5c0-2.3-4.7-3.5-7-3.5z" />
    </svg>
  )
}
