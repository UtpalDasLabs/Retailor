import { useState } from 'react'
import { Resume } from '../schema/resume'
import { buildPrompt } from '../prompt/buildPrompt'

export function Step2Ask({
  resume,
  onToast,
  onContinue,
}: {
  resume: Resume
  onToast: (msg: string) => void
  onContinue: () => void
}) {
  const [copied, setCopied] = useState(false)
  const prompt = buildPrompt(resume)
  const canShare = typeof navigator !== 'undefined' && !!navigator.share

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      onToast('Prompt copied. Now paste it into your AI.')
      setTimeout(() => setCopied(false), 2500)
    } catch {
      onToast('Couldn’t copy automatically — select the text below and copy it.')
    }
  }

  const share = async () => {
    try {
      await navigator.share({ text: prompt })
    } catch {
      /* user dismissed the share sheet */
    }
  }

  return (
    <div className="step">
      <h1 className="step-title">Step 2 — Ask your AI</h1>
      <p className="step-lead">
        Copy this message, paste it into ChatGPT, Claude, Gemini, Perplexity — any AI you use —
        together with the job ad.
      </p>

      <div className="copybar">
        <button type="button" className="btn btn-primary btn-xl" onClick={copy}>
          {copied ? '✓ Copied' : 'Copy prompt'}
        </button>
        {canShare && (
          <button type="button" className="btn btn-lg" onClick={share}>
            Share…
          </button>
        )}
      </div>

      <ol className="howto">
        <li>Open your AI app or website.</li>
        <li>Paste the message you just copied.</li>
        <li>
          Where it says <code>[PASTE THE JOB AD BELOW]</code>, paste the job advert.
        </li>
        <li>Send it.</li>
        <li>Copy the AI’s whole reply, then come back and go to step 3.</li>
      </ol>

      <details className="prompt-peek">
        <summary>See the exact message</summary>
        <pre className="prompt-text">{prompt}</pre>
      </details>

      <p className="legal-note">
        You’re sharing your CV with your chosen AI provider — that’s between you and them. Retailor
        itself never sends your data anywhere.
      </p>

      <div className="step-actions">
        <button type="button" className="btn btn-primary btn-lg" onClick={onContinue}>
          I’ve got the reply → paste it
        </button>
      </div>
    </div>
  )
}
