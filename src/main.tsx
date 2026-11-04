import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './contextos/AuthContext'
import { AuditoriaProvider } from './contextos/AuditoriaContext'
import { DatosProvider } from './contextos/DatosContext'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AuditoriaProvider>
          <DatosProvider>
            <App />
          </DatosProvider>
        </AuditoriaProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
