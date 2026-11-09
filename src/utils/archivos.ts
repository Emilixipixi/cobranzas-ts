// Archivos adjuntos (facturas) guardados en IndexedDB: localStorage no admite archivos de varios MB.

const BASE = 'cobranzasArchivosV1'
const ALMACEN = 'archivos'

export const TAMANO_MAXIMO = 10 * 1024 * 1024
export const TIPOS_PERMITIDOS = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp']

const abrir = (): Promise<IDBDatabase> =>
  new Promise((resolver, rechazar) => {
    const solicitud = indexedDB.open(BASE, 1)
    solicitud.onupgradeneeded = () => solicitud.result.createObjectStore(ALMACEN)
    solicitud.onsuccess = () => resolver(solicitud.result)
    solicitud.onerror = () => rechazar(solicitud.error)
  })

const operar = async <T>(modo: IDBTransactionMode, accion: (almacen: IDBObjectStore) => IDBRequest): Promise<T> => {
  const db = await abrir()
  return new Promise<T>((resolver, rechazar) => {
    const transaccion = db.transaction(ALMACEN, modo)
    const solicitud = accion(transaccion.objectStore(ALMACEN))
    transaccion.oncomplete = () => {
      db.close()
      resolver(solicitud.result as T)
    }
    transaccion.onerror = () => {
      db.close()
      rechazar(transaccion.error)
    }
  })
}

export const guardarArchivo = (clave: string, archivo: Blob) => operar<IDBValidKey>('readwrite', (a) => a.put(archivo, clave))

export const leerArchivo = (clave: string) => operar<Blob | undefined>('readonly', (a) => a.get(clave))

export const borrarArchivo = (clave: string) => operar<undefined>('readwrite', (a) => a.delete(clave))

export const validarArchivo = (archivo: File): string | null => {
  if (!TIPOS_PERMITIDOS.includes(archivo.type)) return 'Formato no admitido: sube un PDF o una imagen (PNG, JPG o WEBP)'
  if (archivo.size > TAMANO_MAXIMO) return 'El archivo supera los 10 MB'
  return null
}

export const formatoTamano = (bytes: number): string =>
  bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`
