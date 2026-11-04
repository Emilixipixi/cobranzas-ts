# Control documental y cobranzas

React + TypeScript + Vite 6 + Tailwind v4 + recharts + lucide-react. Requiere Node 20 o superior.

    npm install
    npm run dev

Abrir http://localhost:5173

Cuentas de prueba (clave demo1234, codigo 2FA 123456):
admin@demo.com, comercial@demo.com, finanzas@demo.com, dev@demo.com

Incluye
- Login con 2FA simulado, roles y rutas protegidas
- Dashboards por rol: Direccion, Finanzas, Comercial y Desarrollo (el administrador alterna entre los cuatro)
- Control de cobranza: facturas, cobros parciales con comprobante y recordatorios (correo y WhatsApp)
- Expediente por proyecto: cobranzas, documentos y minutas, equipo y plazos, auditoria
- Gestion de desarrolladores por el administrador (crear y eliminar). Todo proyecto exige al menos un desarrollador
- Plan de pagos, calendario financiero (proyectado, ejecutado y comparativo) y auditoria
- Tema visual inspirado en DevCollect
- Datos y auditoria guardados en localStorage; el administrador puede restaurar la demo
