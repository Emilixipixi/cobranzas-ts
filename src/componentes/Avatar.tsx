import type { Usuario } from '../tipos'

export const iniciales = (nombre: string): string =>
  nombre.split(' ').filter(Boolean).map((parte) => parte[0]).slice(0, 2).join('').toUpperCase()

/** Foto de perfil del usuario o, si no tiene, sus iniciales. */
export default function Avatar({ usuario, tamano = 36, className = '' }: { usuario: Pick<Usuario, 'nombre' | 'foto'>; tamano?: number; className?: string }) {
  const estilo = { width: tamano, height: tamano, fontSize: Math.max(10, Math.round(tamano * 0.34)) }
  if (usuario.foto) {
    return <img src={usuario.foto} alt={usuario.nombre} style={estilo} className={`shrink-0 rounded-full object-cover ${className}`} />
  }
  return (
    <span style={estilo} className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-emerald-500 font-bold text-white ${className}`}>
      {iniciales(usuario.nombre)}
    </span>
  )
}
