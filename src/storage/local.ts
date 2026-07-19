import { Resume, validateResume } from '../schema/resume'

// All persistence is localStorage. Nothing ever leaves the browser.

const RESUME_KEY = 'retailor.resume.v1'

export function loadResume(): Resume | null {
  try {
    const raw = localStorage.getItem(RESUME_KEY)
    if (!raw) return null
    const { resume } = validateResume(JSON.parse(raw))
    return resume ?? null
  } catch {
    return null
  }
}

export function saveResume(resume: Resume): void {
  try {
    localStorage.setItem(RESUME_KEY, JSON.stringify(resume))
  } catch {
    // Quota exceeded (usually a very large photo). The app keeps working
    // in-memory; the user can still export JSON.
  }
}

export function clearResume(): void {
  localStorage.removeItem(RESUME_KEY)
}

/** Download the current resume as a JSON file (client-side only). */
export function exportResumeJson(resume: Resume): void {
  const name = (resume.basics?.name ?? 'resume').toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const blob = new Blob([JSON.stringify(resume, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name || 'resume'}.private.json`
  a.click()
  URL.revokeObjectURL(url)
}

/** Read a File as text. */
export function readFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

/** Read an image File as a data URL, downscaled to keep localStorage small. */
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
