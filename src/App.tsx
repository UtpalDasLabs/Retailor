import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Resume, validateResume } from './schema/resume'
import sampleResume from './data/sample-resume.json'
import { emptyResume } from './data/empty-resume'
import {
  clearResume,
  exportResumeJson,
  loadResume,
  loadSession,
  readFileText,
  saveResume,
  saveSession,
} from './storage/local'
import { Change, defaultAcceptedIds } from './parse/diff'
import { parseReply } from './parse/parseReply'
import { Stepper } from './wizard/Stepper'
import { Step1Cv } from './wizard/Step1Cv'
import { Step2Ask } from './wizard/Step2Ask'
import { Step3Paste } from './wizard/Step3Paste'

// Step 4 pulls in react-pdf + pdf.js (heavy). Load it only when reached so the
// first three steps stay fast on mobile.
const Step4Review = lazy(() =>
  import('./wizard/Step4Review').then((m) => ({ default: m.Step4Review })),
)

const INTRO_KEY = 'retailor.introSeen.v2'

function initialResume(): Resume {
  return loadResume() ?? emptyResume()
}

export function App() {
  const [resume, setResume] = useState<Resume>(initialResume)
  const [step, setStep] = useState(1)
  const [maxReached, setMaxReached] = useState(1)
  const [reply, setReply] = useState('')
  const [changes, setChanges] = useState<Change[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [accepted, setAccepted] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showIntro, setShowIntro] = useState(() => {
    try {
      return localStorage.getItem(INTRO_KEY) !== '1'
    } catch {
      return true
    }
  })
  const jsonInput = useRef<HTMLInputElement>(null)
  const toastTimer = useRef<number>()

  // Restore session (step + pasted reply) once on mount.
  useEffect(() => {
    const s = loadSession()
    if (!s) return
    setReply(s.reply ?? '')
    const base = loadResume() ?? emptyResume()
    if (s.step === 4 && s.reply) {
      const res = parseReply(s.reply, base)
      if (res.ok) {
        setChanges(res.changes)
        setWarnings(res.warnings)
        setAccepted(defaultAcceptedIds(res.changes))
        goTo(4)
        return
      }
    }
    goTo(Math.min(s.step ?? 1, 3))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => saveResume(resume), 300)
    return () => window.clearTimeout(t)
  }, [resume])

  useEffect(() => {
    saveSession({ step, reply })
  }, [step, reply])

  const goTo = (n: number) => {
    setStep(n)
    setMaxReached((m) => Math.max(m, n))
  }

  const showToast = (msg: string) => {
    setToast(msg)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 4000)
  }

  const dismissIntro = () => {
    setShowIntro(false)
    try {
      localStorage.setItem(INTRO_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  const importJson = async (file: File) => {
    try {
      const data = JSON.parse(await readFileText(file))
      const { resume: parsed, errors } = validateResume(data)
      if (parsed) {
        setResume(parsed)
        showToast('CV loaded. It stays in this browser only.')
      } else {
        showToast('That file isn’t a valid CV: ' + (errors?.[0] ?? 'unknown error'))
      }
    } catch (e) {
      showToast('That file isn’t valid JSON: ' + (e instanceof Error ? e.message : String(e)))
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-logo">Retailor</div>
        <div className="header-menu">
          <button
            type="button"
            className="btn btn-ghost"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            My data ▾
          </button>
          {menuOpen && (
            <div className="menu" onMouseLeave={() => setMenuOpen(false)}>
              <button
                type="button"
                onClick={() => {
                  jsonInput.current?.click()
                  setMenuOpen(false)
                }}
              >
                Import CV file (.json)
              </button>
              <button
                type="button"
                onClick={() => {
                  exportResumeJson(resume)
                  setMenuOpen(false)
                }}
              >
                Save CV file (.json)
              </button>
              <button
                type="button"
                className="danger"
                onClick={() => {
                  if (window.confirm('Erase your CV from this browser and start over?')) {
                    clearResume()
                    setResume(emptyResume())
                    setReply('')
                    setChanges([])
                    setAccepted(new Set())
                    setStep(1)
                    setMaxReached(1)
                    setMenuOpen(false)
                    showToast('Cleared. Everything is gone from this browser.')
                  }
                }}
              >
                Erase everything
              </button>
            </div>
          )}
        </div>
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
      </header>

      {showIntro && (
        <div className="intro">
          <div className="intro-body">
            <strong>How it works.</strong> Put your CV in, then let any AI chatbot tailor it to a
            job ad you paste. Retailor turns the reply into a beautifully designed PDF — and nothing
            ever leaves your browser.
            <button type="button" className="btn btn-sm" onClick={dismissIntro}>
              Got it
            </button>
          </div>
        </div>
      )}

      <Stepper step={step} maxReached={maxReached} onGo={goTo} />

      <main className="app-main">
        {step === 1 && (
          <Step1Cv
            resume={resume}
            onChange={setResume}
            onLoadSample={() => {
              setResume(structuredClone(sampleResume) as Resume)
              showToast('Example CV loaded — edit it, then continue.')
            }}
            onImportFile={importJson}
            onStartBlank={() => setResume(emptyResume())}
            onToast={showToast}
            onContinue={() => goTo(2)}
          />
        )}
        {step === 2 && <Step2Ask resume={resume} onToast={showToast} onContinue={() => goTo(3)} />}
        {step === 3 && (
          <Step3Paste
            reply={reply}
            onReplyChange={setReply}
            base={resume}
            onGoStep2={() => goTo(2)}
            onToast={showToast}
            onParsed={(res) => {
              setChanges(res.changes)
              setWarnings(res.warnings)
              setAccepted(defaultAcceptedIds(res.changes))
              goTo(4)
            }}
          />
        )}
        {step === 4 && (
          <Suspense fallback={<div className="pdfprev-status">Loading the review…</div>}>
            <Step4Review
              base={resume}
              changes={changes}
              warnings={warnings}
              accepted={accepted}
              setAccepted={setAccepted}
              onToast={showToast}
              onStartAnother={(applied) => {
                setResume(applied)
                setReply('')
                setChanges([])
                setWarnings([])
                setAccepted(new Set())
                goTo(2)
              }}
            />
          </Suspense>
        )}
      </main>

      <footer className="app-footer">
        100% in your browser — your CV, photo, and edits never leave this device. Open source, MIT
        licensed.
      </footer>

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  )
}
