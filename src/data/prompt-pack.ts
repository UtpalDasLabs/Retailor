/**
 * The Prompt Pack — copy-paste instructions the user hands to any LLM so its
 * reply ends with a machine-readable `cv-edits` block Retailor can import.
 * Kept here (not just in the README) so the app can show it in the Import
 * Feedback tab with a one-click copy button.
 */
export const PROMPT_PACK = `After your assessment, always end your reply with a fenced code block labeled \`cv-edits\` containing JSON with \`version\` (always 1), \`targetRole\`, \`rationale\`, and an \`edits\` array of \`{op, path, value, why}\` operations against my resume JSON (JSON Resume schema, arrays zero-indexed, paths as JSON Pointers, ops: set/replace/insert/remove/move). Propose 5–15 surgical edits; never invent facts not present in my CV.`
