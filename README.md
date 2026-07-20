# Retailor

**Tailor your CV to any job with the AI you already use — and download a beautifully designed PDF. Everything happens in your browser.**

Retailor walks you through four simple steps: put your CV in, copy a ready-made message into any AI chatbot together with the job advert, paste the AI's reply back, then review the suggested changes and download a polished PDF. There is no sign-up, no app to install, and nothing is ever uploaded.

## What is this?

Job hunting means rewriting your CV for every role. Retailor lets **any** AI assistant (ChatGPT, Claude, Gemini, Perplexity — whatever you already use) do the tailoring, then turns the result into a clean, professional PDF. You stay in control: you see every change the AI suggests and decide what to keep.

## Is my data safe?

Yes. Retailor runs entirely in your web browser.

- **Nothing is uploaded to Retailor.** Your CV, your photo, and your edits stay on your device (in your browser's local storage). There is no server, no account, and no database.
- **No tracking.** No analytics, no advertising, no third-party requests. Even the fonts and the pdf.js worker are served from the app's own domain (bundled), so your browser's Network tab shows only Retailor itself. Check it yourself.
- When you go to **step 2**, you choose to paste your CV into your AI provider (ChatGPT, etc.). That part is between you and them — the same as if you'd typed it into their chat yourself. Retailor never sends it anywhere.

## The four steps

1. **Your CV** — start from the built-in example, import an existing CV (**PDF or Word**, read entirely in your browser), load a CV file you saved before, or type your details into a simple form. Add a photo if you like (it stays on your device).
2. **Ask your AI** — paste the job advert into Retailor, tap **Copy prompt**, then drop the message into your AI chatbot and send. (Leave the advert blank and the message keeps a "paste the job ad here" placeholder instead.) The prompt tells the AI to act as a hiring manager, assess your fit honestly, and return your complete tailored CV — without inventing anything.
3. **Paste the reply** — copy the AI's whole answer and paste it back into Retailor. It reads the reply and works out exactly what changed.
4. **Review & download** — see each suggested change side by side (what you have now vs. what the AI suggests), keep or drop each one, preview the finished CV, and **download your PDF**. You can also save your updated CV as a file for next time.

> A reminder shown in the app: AIs sometimes exaggerate. Always check the changes — you are responsible for what your CV claims.

## For developers

Retailor is a fully static Vite + React + TypeScript app.

```bash
npm install
npm run dev      # local dev server
npm test         # parser, prompt, merge, diff & import test suite (Vitest)
npm run build    # static production build in dist/
```

### How it works under the hood

- **PDF generation** uses [`@react-pdf/renderer`](https://react-pdf.org/): the CV template is defined once as React components and rendered to a real PDF blob. The on-screen preview is that same blob rendered to canvases with **pdf.js** (`react-pdf`), so what you preview is exactly what you download. There is no `window.print()` — the download saves the blob directly (with a native share-sheet fallback for iOS Safari).
- **Reply parsing** (`src/parse/`) is built to survive messy, real-world LLM output. It scans every fenced and bare JSON block, parses leniently (tolerating trailing commas, comments, and smart quotes), and picks the last block that looks like a resume. That reply is deep-merged onto your current CV (unknown fields preserved, anything the AI omitted is kept from your data), and the difference is shown as a section-aware, toggleable diff. A legacy `cv-edits` block is still accepted for back-compatibility, with forgiving op-name synonyms. If the AI renames you, that change is flagged and left off by default.
- **Importing a PDF/Word CV** (`src/import/`) happens entirely in the browser: text is extracted with the bundled pdf.js worker (same-origin — no CDN) or `mammoth` for DOCX, then a conservative heuristic pre-fills the fields it's confident about (name, contact details, headline, summary) and leaves the rest for you — on complex two-column layouts it may only fill contact details and leave name/headline to you or the AI path. For a cleaner structured result there's an optional AI path: the extracted text is turned into a copy-paste prompt, and the AI's JSON reply flows back through the same parser. Scanned/image-only PDFs have no text layer, so extraction finds nothing and the app points you to the form or AI instead. No file is ever uploaded.
- **Everything is local.** State lives in `localStorage` (versioned, with automatic migration from the previous version). Fonts are bundled; there are no runtime network calls to third parties.

### Fonts, templates, privacy

- Fonts: **Source Sans 3** and **Source Serif 4**, used under the SIL Open Font License 1.1. UI fonts are bundled as WOFF2; the PDF embeds TrueType subsets.
- Templates live in `src/pdf/` and register in `src/pdf/registry.ts` — adding one is a component plus a registry entry. The first template, **berlin-blue**, is a two-column A4 design (navy sidebar, serif display name) that flows cleanly to as many pages as the content needs.
- The repository ships only a **fictional sample persona** ("Robin Fields"). Keep your real CV out of git — exported files are named `*.private.json` and, like a `private/` folder, are gitignored.

### Deploying to GitHub Pages

The included workflow (`.github/workflows/deploy.yml`) runs the tests, builds the app, and publishes it to GitHub Pages on every push to `main`. One-time setup: in the repository settings, set **Pages → Source → GitHub Actions**. The app is served at `https://<owner>.github.io/Retailor/` (the Vite `base` is `/Retailor/`; adjust it if you rename or fork the repo).

## Disclaimer

Retailor is provided "as is", without warranty of any kind. You are responsible for the accuracy of your CV and for verifying every change an AI proposes — models can and do make things up. Nothing here is career or legal advice.

## License

[MIT](./LICENSE). Fonts (Source Sans 3, Source Serif 4) are used under the SIL Open Font License 1.1.
