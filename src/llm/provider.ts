import { CvEdits } from '../schema/edits'
import { Resume } from '../schema/resume'

/**
 * v2 — LLM-agnostic tailoring layer (interface only; NO network calls in v1).
 *
 * The plan: users bring their own API key (stored in localStorage only) and
 * Retailor calls the provider directly from the browser to generate a
 * cv-edits block from a job description. Until then, the same contract works
 * manually: paste the Prompt Pack into any chat, save the reply as Markdown,
 * and drop it on the Import Feedback screen.
 */
export interface LLMProvider {
  id: string
  label: string
  /** True once the adapter is implemented and a key is configured. */
  available: boolean
  generateEdits(
    resume: Resume,
    jobDescription: string,
    instructions?: string,
  ): Promise<CvEdits>
}

function notImplemented(label: string): LLMProvider['generateEdits'] {
  return async () => {
    throw new Error(
      `${label} adapter is coming in v2. Bring-your-own-API-key, stored in localStorage only.`,
    )
  }
}

export const anthropicProvider: LLMProvider = {
  id: 'anthropic',
  label: 'Anthropic (Claude)',
  available: false,
  generateEdits: notImplemented('Anthropic'),
}

export const openaiProvider: LLMProvider = {
  id: 'openai',
  label: 'OpenAI (GPT)',
  available: false,
  generateEdits: notImplemented('OpenAI'),
}

export const googleProvider: LLMProvider = {
  id: 'google',
  label: 'Google (Gemini)',
  available: false,
  generateEdits: notImplemented('Google'),
}

export const openrouterProvider: LLMProvider = {
  id: 'openrouter',
  label: 'OpenRouter',
  available: false,
  generateEdits: notImplemented('OpenRouter'),
}

export const providers: LLMProvider[] = [
  anthropicProvider,
  openaiProvider,
  googleProvider,
  openrouterProvider,
]
