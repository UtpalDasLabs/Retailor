import { useEffect, useMemo, useRef, useState } from 'react'
import { Document, Page } from 'react-pdf'
import './pdfWorker'

// Renders a generated PDF blob to canvases with pdf.js, all pages stacked and
// scrollable, with zoom controls. The scroll container allows native pinch-zoom
// on touch devices too.

export function PdfPreview({ blob, loading }: { blob: Blob | null; loading?: boolean }) {
  const [numPages, setNumPages] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [baseWidth, setBaseWidth] = useState(560)
  const wrapRef = useRef<HTMLDivElement>(null)

  // Fit the page width to the container (A4 aspect), leaving room to scroll.
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const measure = () => {
      const avail = el.clientWidth - 24
      setBaseWidth(Math.max(280, Math.min(720, avail)))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob])
  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [url])

  const width = Math.round(baseWidth * zoom)

  return (
    <div className="pdfprev">
      <div className="pdfprev-toolbar">
        <button
          type="button"
          className="btn btn-sm"
          aria-label="Zoom out"
          onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.15).toFixed(2)))}
        >
          −
        </button>
        <span className="pdfprev-zoom">{Math.round(zoom * 100)}%</span>
        <button
          type="button"
          className="btn btn-sm"
          aria-label="Zoom in"
          onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.15).toFixed(2)))}
        >
          +
        </button>
        <button type="button" className="btn btn-sm" onClick={() => setZoom(1)}>
          Fit
        </button>
        {numPages > 0 && (
          <span className="pdfprev-count">
            {numPages} page{numPages > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="pdfprev-scroll" ref={wrapRef}>
        {loading && !url ? (
          <div className="pdfprev-status">Building your PDF…</div>
        ) : url ? (
          <Document
            file={url}
            onLoadSuccess={(d: { numPages: number }) => setNumPages(d.numPages)}
            loading={<div className="pdfprev-status">Building your PDF…</div>}
            error={<div className="pdfprev-status">Couldn’t render the preview.</div>}
          >
            {Array.from({ length: numPages }, (_, i) => (
              <div className="pdfprev-page" key={i}>
                <Page
                  pageNumber={i + 1}
                  width={width}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </div>
            ))}
          </Document>
        ) : (
          <div className="pdfprev-status">No preview yet.</div>
        )}
      </div>
    </div>
  )
}
