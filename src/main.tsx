import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { App } from './App'
import './webfonts.css'
import './ui.css'

// Installable + offline. `autoUpdate` swaps in a new build on the next visit,
// so a deploy never leaves someone on a stale app shell.
registerSW({ immediate: true })

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
