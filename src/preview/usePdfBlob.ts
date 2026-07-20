import { useEffect, useState } from 'react'
import { Resume } from '../schema/resume'
import { renderResumePdf } from '../pdf/renderPdf'

export interface PdfBlobState {
  blob: Blob | null
  loading: boolean
  error: string | null
}

/**
 * Generate the CV PDF from a resume, debounced so rapid edits don't thrash the
 * renderer. Returns the latest blob (reused for both preview and download).
 */
export function usePdfBlob(resume: Resume, delay = 350): PdfBlobState {
  const [state, setState] = useState<PdfBlobState>({ blob: null, loading: true, error: null })

  useEffect(() => {
    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: null }))
    const timer = window.setTimeout(() => {
      renderResumePdf(resume)
        .then((blob) => {
          if (!cancelled) setState({ blob, loading: false, error: null })
        })
        .catch((e) => {
          if (!cancelled)
            setState({ blob: null, loading: false, error: e instanceof Error ? e.message : String(e) })
        })
    }, delay)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [resume, delay])

  return state
}
