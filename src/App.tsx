import { Route, Routes } from 'react-router-dom'
import Layout from './componentes/Layout'
import RutaProtegida from './componentes/RutaProtegida'
import Auditoria from './paginas/Auditoria'
import Calendario from './paginas/Calendario'
import Cobranza from './paginas/Cobranza'
import Dashboard from './paginas/Dashboard'
import Desarrolladores from './paginas/Desarrolladores'
import Documentos from './paginas/Documentos'
import Expediente from './paginas/Expediente'
import Login from './paginas/Login'
import Pendiente from './paginas/Pendiente'
import PlanPagos from './paginas/PlanPagos'
import Proyectos from './paginas/Proyectos'
import Reuniones from './paginas/Reuniones'
import Usuarios from './paginas/Usuarios'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RutaProtegida>
            <Layout />
          </RutaProtegida>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="proyectos" element={<Proyectos />} />
        <Route path="proyectos/:id" element={<Expediente />} />
        <Route
          path="cobranza"
          element={
            <RutaProtegida roles={['administrador', 'finanzas']}>
              <Cobranza />
            </RutaProtegida>
          }
        />
        <Route path="documentos" element={<Documentos />} />
        <Route path="reuniones" element={<Reuniones />} />
        <Route
          path="plan-pagos"
          element={
            <RutaProtegida roles={['administrador', 'comercial', 'finanzas']}>
              <PlanPagos />
            </RutaProtegida>
          }
        />
        <Route
          path="calendario"
          element={
            <RutaProtegida roles={['administrador', 'comercial', 'finanzas']}>
              <Calendario />
            </RutaProtegida>
          }
        />
                <Route
          path="usuarios"
          element={
            <RutaProtegida roles={['administrador']}>
              <Usuarios />
            </RutaProtegida>
          }
        />
        
        <Route
          path="desarrolladores"
          element={
            <RutaProtegida roles={['administrador']}>
              <Desarrolladores />
            </RutaProtegida>
          }
        />
        <Route
          path="auditoria"
          element={
            <RutaProtegida roles={['administrador']}>
              <Auditoria />
            </RutaProtegida>
          }
        />
        <Route path="*" element={<Pendiente />} />
      </Route>
    </Routes>
  )
}
