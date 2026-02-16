import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './pwaInstall' // Capture install prompt as early as possible
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
