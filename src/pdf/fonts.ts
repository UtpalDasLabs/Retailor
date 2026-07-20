import { Font } from '@react-pdf/renderer'

// TTFs are imported as bundled, same-origin assets (Vite `?url`). react-pdf
// fetches them from our own origin at generation time — no third-party request.
import sans400 from './fonts/SourceSans3-Regular.ttf?url'
import sans700 from './fonts/SourceSans3-Bold.ttf?url'
import sans400i from './fonts/SourceSans3-It.ttf?url'
import sans700i from './fonts/SourceSans3-BoldIt.ttf?url'
import serif700i from './fonts/SourceSerif4-BoldIt.ttf?url'
import serif400i from './fonts/SourceSerif4-It.ttf?url'

let registered = false

/** Register the berlin-blue fonts once, before rendering the PDF. */
export function registerPdfFonts(): void {
  if (registered) return
  registered = true

  Font.register({
    family: 'SourceSans3',
    fonts: [
      { src: sans400, fontWeight: 400 },
      { src: sans700, fontWeight: 700 },
      { src: sans400i, fontWeight: 400, fontStyle: 'italic' },
      { src: sans700i, fontWeight: 700, fontStyle: 'italic' },
    ],
  })

  Font.register({
    family: 'SourceSerif4',
    fonts: [
      { src: serif400i, fontWeight: 400, fontStyle: 'italic' },
      { src: serif700i, fontWeight: 700, fontStyle: 'italic' },
    ],
  })

  // Keep words whole — the sidebar relies on wrapping, not hyphenation.
  Font.registerHyphenationCallback((word) => [word])
}
