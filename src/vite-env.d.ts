/// <reference types="vite/client" />

declare module '*.md?raw' {
  const content: string
  export default content
}

// mammoth ships types for its main entry but not the browser subpath we import.
declare module 'mammoth/mammoth.browser.js' {
  export function extractRawText(input: {
    arrayBuffer: ArrayBuffer
  }): Promise<{ value: string; messages: unknown[] }>
}
