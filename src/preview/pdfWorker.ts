import { pdfjs } from 'react-pdf'
// Bundle the pdf.js worker as a same-origin asset (Vite `?url`) so the preview
// never reaches out to a CDN. The version must match react-pdf's pdfjs.
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
