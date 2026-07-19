import { useEffect, useRef, useState } from 'react'
import { Resume, validateResume } from '../schema/resume'
import sampleResume from '../data/sample-resume.json'
import { emptyResume } from '../data/empty-resume'
import {
  clearResume,
  exportResumeJson,
  loadResume,
  readFileText,
  saveResume,
} from '../storage/local'
import { EditorView } from './EditorView'
import { ImportView } from './ImportView'
import { PreviewView } from './PreviewView'
import './app.css'

type Tab = 'editor' | 'import' | 'preview'

const TABS: { id: Tab; label: string; hint: string }[] = [
  { id: 'editor', label: 'Editor', hint: 'Type or edit your CV details' },
  { id: 'import', label: 'Import Feedback', hint: 'Apply tailoring edits from any AI' },
  { id: 'preview', label: 'Preview', hint: 'See your CV and save it as a PDF' },
]

// A first-time visitor (nothing saved yet) starts with a blank CV, so every
// editor field is empty. Returning visitors get their saved data back.
const savedResume = loadResume()

function initialResume(): Resume {
  return savedResume ?? emptyResume()
}

export function App() {
  const [resume, setResume] = useState<Resume>(initialResume)
  // Newcomers land on the Editor (there's nothing to preview yet); people with
  // saved data land on the Preview.
  const [tab, setTab] = useState<Tab>(savedResume ? 'preview' : 'editor')
  const [toast, setToast] = useState<string | null>(null)
  const jsonInput = useRef<HTMLInputElement>(null)
  const toastTimer = useRef<number>()

  useEffect(() => {
    const t = window.setTimeout(() => saveResume(resume), 300)
    return () => window.clearTimeout(t)
  }, [resume])

  const showToast = (msg: string) => {
    setToast(msg)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 4000)
  }

  const importJson = async (file: File) => {
    try {
      const data = JSON.parse(await readFileText(file))
      const { resume: parsed, errors } = validateResume(data)
      if (parsed) {
        setResume(parsed)
        setTab('preview')
        showToast('Resume imported. It stays in this browser only.')
      } else {
        showToast('Invalid resume JSON: ' + (errors?.[0] ?? 'unknown error'))
      }
    } catch (e) {
      showToast('Not valid JSON: ' + (e instanceof Error ? e.message : String(e)))
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-logo">Retailor</div>
        <nav className="app-tabs" role="tablist" aria-label="Views">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className="app-tab"
              title={t.hint}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className="app-header-actions">
          <input
            ref={jsonInput}
            type="file"
            accept=".json,application/json"
            className="visually-hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) importJson(f)
              e.target.value = ''
            }}
          />
          <button
            type="button"
            className="btn-ghost btn"
            title="Load a CV you saved earlier (a .json file from Export)"
            onClick={() => jsonInput.current?.click()}
          >
            Import JSON
          </button>
          <button
            type="button"
            className="btn-ghost btn"
            title="Save your CV to your computer as a backup file (.json)"
            onClick={() => exportResumeJson(resume)}
          >
            Export JSON
          </button>
          <button
            type="button"
            className="btn-ghost btn"
            title="Fill the app with a fictional example CV so you can explore"
            onClick={() => {
              if (
                window.confirm(
                  'Replace the current CV with a fictional example? Your current data will be overwritten — click "Export JSON" first if you want to keep it.',
                )
              ) {
                clearResume()
                setResume(structuredClone(sampleResume) as Resume)
                setTab('preview')
                showToast('Fictional example loaded — explore, then Load a blank CV or Import your own.')
              }
            }}
          >
            Load sample
          </button>
        </div>
      </header>

      <main className="app-main">
        {tab === 'editor' ? (
          <EditorView resume={resume} onChange={setResume} onToast={showToast} />
        ) : tab === 'import' ? (
          <ImportView
            resume={resume}
            onApply={(r) => setResume(r)}
            onToast={showToast}
          />
        ) : (
          <PreviewView resume={resume} onChange={setResume} />
        )}
      </main>

      <footer className="app-footer">
        100% client-side: your CV, photo, and edits never leave this browser
        (localStorage only). Open source, MIT licensed.
      </footer>

      {toast ? (
        <div className="toast" role="status">
          {toast}
        </div>
      ) : null}
    </div>
  )
}
