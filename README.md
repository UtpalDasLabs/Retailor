# Retailor

**Open-source, LLM-agnostic CV tailoring — entirely in your browser.**

Retailor lets you keep your CV as structured data (JSON Resume + extensions), apply tailoring feedback from **any** LLM session as a reviewable set of edits, preview the result in a pixel-faithful A4 template, and save a print-perfect PDF. There is no backend, no account, and no upload.

## Privacy statement

- **All processing is local.** Retailor is a 100% static, client-side app. Your CV data, photo, and (in future) API keys live in your browser's `localStorage` only and never leave it.
- **No network calls at runtime.** Fonts are self-hosted; there are no analytics, trackers, or API requests. Verify it yourself in the browser's network tab.
- The repository ships only a **fictional sample persona** ("Robin Fields"), and the editor **starts empty** so your data is never pre-filled. Keep your real data in `*.private.json` files or a `private/` folder — both are gitignored.

## Quick start

```bash
npm install
npm run dev        # local dev server
npm run build      # static production build in dist/
```

Open the app, then:

1. **Load your CV** — the editor starts blank. Type your details in the **Editor** tab, or `Import JSON` (JSON Resume schema, see below) to load a file you saved before, or `Load sample` to explore the fictional example. Every tab has a plain-English "How to use this" panel. A photo is optional and stays in localStorage.
2. **Get tailoring feedback** — paste the Prompt Pack (below) into any LLM chat along with your resume JSON and a job description. Save the reply as a Markdown file.
3. **Import Feedback** — drop the Markdown file (or paste the reply). Retailor finds the last ` ```cv-edits ` block, validates it, and shows every proposed edit with before/after and the model's reasoning. Accept or reject each one.
4. **Preview & download** — the A4 preview updates instantly. `Download PDF` uses the browser print pipeline: choose *Save as PDF*, margins *None*, *Background graphics* on. The output is vector, with selectable text.
5. **Export JSON** — keep your updated master file (it downloads as `*.private.json`, which git ignores).

## The `cv-edits` block

Any LLM can tailor your CV by ending its reply with a fenced block labeled `cv-edits`:

````markdown
```cv-edits
{
  "version": 1,
  "targetRole": "VP Product — Consumer Services",
  "rationale": "One-line summary of the tailoring strategy",
  "edits": [
    { "op": "set",     "path": "/basics/label", "value": "…", "why": "…" },
    { "op": "replace", "path": "/work/1/highlights/0", "value": "…", "why": "…" },
    { "op": "insert",  "path": "/work/0/highlights/2", "value": "…", "why": "…" },
    { "op": "remove",  "path": "/x_portfolio/5", "why": "…" },
    { "op": "move",    "from": "/work/3", "path": "/work/4", "why": "…" }
  ]
}
```
````

- Ops: `set` (replace the value at a path), `replace` (alias of `set`), `insert` (into an array at an index), `remove`, `move`.
- Paths are [JSON Pointers](https://datatracker.ietf.org/doc/html/rfc6901) into the resume object; arrays are zero-indexed.
- Edits apply sequentially. If one path fails to resolve it is marked as failed in the review screen and the rest continue.
- Retailor always uses the **last** `cv-edits` block in the document, so the model can think out loud above it.

See `src/data/example-feedback.md` for a complete example (also available in-app via *Try the bundled example*).

## Prompt Pack

Append this to any LLM chat / project instructions:

> After your assessment, always end your reply with a fenced code block labeled `cv-edits` containing JSON with `version` (always 1), `targetRole`, `rationale`, and an `edits` array of `{op, path, value, why}` operations against my resume JSON (JSON Resume schema, arrays zero-indexed, paths as JSON Pointers, ops: set/replace/insert/remove/move). Propose 5–15 surgical edits; never invent facts not present in my CV.

Then paste your resume JSON (export it from Retailor) and the job description, and ask for tailoring advice.

## Data model

Base: [JSON Resume](https://jsonresume.org/schema/) (`basics`, `work`, `education`, `certificates`, `awards`, `languages`) plus optional extensions:

| Field | Type | Rendered as |
| --- | --- | --- |
| `basics.summary` | `string[]` | Summary paragraphs |
| `basics.x_highlights` | `string[]` | "Highlights" bullets |
| `basics.x_birthDate`, `basics.x_residency` | `string` | About-me rows |
| `basics.picture` | data-URL string \| null | Sidebar photo |
| `x_coreCompetence` | `string[]` | Core competence |
| `x_advisory` | `{role, organization, startDate, endDate}[]` | Advisory |
| `x_portfolio` | `string[]` | Product portfolio |
| `x_memberships` | `{organization, since}[]` | Active membership |
| `meta.template` | template id | Selected template |

Unknown fields are preserved through import → edit → export.

## Templates

Templates live in `src/templates/<id>/` and register in `src/templates/registry.ts` — adding a template is one folder plus one registry entry. The first template, **berlin-blue**, is a two-column A4 design (navy sidebar, serif display name) that reflows and repaginates cleanly as content grows or shrinks.

## Loading a private resume file

Keep your real CV out of git:

1. Export from Retailor → the file is named `<your-name>.private.json` (gitignored, as is any `private/` folder).
2. To load it later: `Import JSON` in the app header. Data persists in that browser's localStorage until you clear it.

## Deploying to GitHub Pages

The included GitHub Actions workflow (`.github/workflows/deploy.yml`) builds the app and publishes it to GitHub Pages on every push to `main`. One-time setup: in the repository settings, set **Pages → Source → GitHub Actions**. The app is served at `https://<owner>.github.io/Retailor/` (the Vite `base` is set to `/Retailor/`; adjust it if you rename or fork the repo).

## v2: bring-your-own-key LLM layer

`src/llm/provider.ts` defines the `LLMProvider` interface with adapter skeletons for Anthropic, OpenAI, Google, and OpenRouter. In v2 the app will call your chosen provider directly from the browser with your own API key (stored in localStorage only). v1 intentionally makes **no** network calls.

## Disclaimer of liability

Retailor is provided "as is", without warranty of any kind. You are responsible for the accuracy of your CV and for verifying every edit an LLM proposes — models can and do make things up. Nothing in this tool constitutes career or legal advice.

## License

[MIT](./LICENSE). Fonts (Source Sans 3, Source Serif 4) are used under the SIL Open Font License 1.1.
