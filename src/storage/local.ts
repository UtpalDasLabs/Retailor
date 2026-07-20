import { Resume, validateResume } from '../schema/resume'

// Everything lives in localStorage. Nothing is ever uploaded.

const RESUME_KEY = 'retailor.resume.v2'
const RESUME_KEY_V1 = 'retailor.resume.v1'
const SESSION_KEY = 'retailor.session.v2'

export function loadResume(): Resume | null {
  try {
    const raw = localStorage.getItem(RESUME_KEY)
    if (raw) return validateResume(JSON.parse(raw)).resume ?? null
    // Migrate a v1 save forward on first run of v2.
    const v1 = localStorage.getItem(RESUME_KEY_V1)
    if (v1) {
      const { resume } = validateResume(JSON.parse(v1))
      if (resume) {
        saveResume(resume)
        return resume
      }
    }
    return null
  } catch {
    return null
  }
}

export function saveResume(resume: Resume): void {
  try {
    localStorage.setItem(RESUME_KEY, JSON.stringify(resume))
  } catch {
    // Quota exceeded (usually a large photo). App keeps working in-memory.
  }
}

export function clearResume(): void {
  localStorage.removeItem(RESUME_KEY)
  localStorage.removeItem(SESSION_KEY)
}

export interface Session {
  step: number
  reply: string
}

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

export function saveSession(session: Session): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    /* ignore */
  }
}

/** Download the resume as a JSON file (client-side only). */
export function exportResumeJson(resume: Resume): void {
  const name = (resume.basics?.name ?? 'my').toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const blob = new Blob([JSON.stringify(resume, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name || 'my'}-cv.private.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function readFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

/** Read an image File as a downscaled data URL (kept only in localStorage). */
export function readImageAsDataUrl(file: File, maxSize = 600): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.88))
      }
      img.onerror = () => reject(new Error('could not decode image'))
      img.src = String(reader.result)
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

/** Download an arbitrary Blob (used for the generated PDF). */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Save the generated PDF. On iOS Safari the `download` attribute is unreliable,
 * so prefer the native share sheet (Save to Files / share) when the browser can
 * share files; fall back to a normal download elsewhere. Returns false only if
 * the user explicitly cancels the share sheet.
 */
export async function savePdf(blob: Blob, filename: string): Promise<boolean> {
  const nav = navigator as Navigator & {
    canShare?: (data?: unknown) => boolean
    share?: (data?: unknown) => Promise<void>
  }
  try {
    const file = new File([blob], filename, { type: 'application/pdf' })
    if (nav.canShare?.({ files: [file] }) && nav.share) {
      try {
        await nav.share({ files: [file], title: filename })
        return true
      } catch (e) {
        // User dismissed the sheet — don't also trigger a download.
        if (e instanceof DOMException && e.name === 'AbortError') return false
        // Any other error: fall through to the download path.
      }
    }
  } catch {
    // File constructor unsupported — fall through to the download path.
  }
  downloadBlob(blob, filename)
  return true
}
