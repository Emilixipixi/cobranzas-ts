import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import Alertas from './componentes/Alertas'
import { AlertasProvider } from './contextos/AlertasContext'
import { AuthProvider } from './contextos/AuthContext'
import { AuditoriaProvider } from './contextos/AuditoriaContext'
import { DatosProvider } from './contextos/DatosContext'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AlertasProvider>
          <AuditoriaProvider>
            <DatosProvider>
              <App />
              <Alertas />
            </DatosProvider>
          </AuditoriaProvider>
        </AlertasProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)