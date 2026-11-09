// Catálogo precargado de tecnologías. Las nuevas que se registren con un desarrollador se suman solas,
// porque el catálogo final une esta lista con las tecnologías que ya tiene el equipo.

export const CATALOGO_TECNOLOGIAS: { nombre: string; categoria: string }[] = [
  // Frontend
  { nombre: 'React', categoria: 'Frontend' },
  { nombre: 'Angular', categoria: 'Frontend' },
  { nombre: 'Vue.js', categoria: 'Frontend' },
  { nombre: 'Next.js', categoria: 'Frontend' },
  { nombre: 'Svelte', categoria: 'Frontend' },
  { nombre: 'HTML', categoria: 'Frontend' },
  { nombre: 'CSS', categoria: 'Frontend' },
  { nombre: 'Tailwind', categoria: 'Frontend' },
  { nombre: 'Bootstrap', categoria: 'Frontend' },
  // Lenguajes
  { nombre: 'JavaScript', categoria: 'Lenguaje' },
  { nombre: 'TypeScript', categoria: 'Lenguaje' },
  { nombre: 'Python', categoria: 'Lenguaje' },
  { nombre: 'Java', categoria: 'Lenguaje' },
  { nombre: 'C#', categoria: 'Lenguaje' },
  { nombre: 'PHP', categoria: 'Lenguaje' },
  { nombre: 'Go', categoria: 'Lenguaje' },
  { nombre: 'Kotlin', categoria: 'Lenguaje' },
  { nombre: 'Swift', categoria: 'Lenguaje' },
  { nombre: 'Dart', categoria: 'Lenguaje' },
  // Backend
  { nombre: 'Node.js', categoria: 'Backend' },
  { nombre: 'Express', categoria: 'Backend' },
  { nombre: 'NestJS', categoria: 'Backend' },
  { nombre: 'Django', categoria: 'Backend' },
  { nombre: 'Flask', categoria: 'Backend' },
  { nombre: 'Spring Boot', categoria: 'Backend' },
  { nombre: '.NET', categoria: 'Backend' },
  { nombre: 'Laravel', categoria: 'Backend' },
  { nombre: 'Prisma', categoria: 'Backend' },
  { nombre: 'GraphQL', categoria: 'Backend' },
  // Móvil
  { nombre: 'React Native', categoria: 'Móvil' },
  { nombre: 'Flutter', categoria: 'Móvil' },
  { nombre: 'Android', categoria: 'Móvil' },
  { nombre: 'iOS', categoria: 'Móvil' },
  // Datos
  { nombre: 'PostgreSQL', categoria: 'Base de datos' },
  { nombre: 'MySQL', categoria: 'Base de datos' },
  { nombre: 'SQL Server', categoria: 'Base de datos' },
  { nombre: 'MongoDB', categoria: 'Base de datos' },
  { nombre: 'Redis', categoria: 'Base de datos' },
  { nombre: 'Firebase', categoria: 'Base de datos' },
  // Infraestructura y calidad
  { nombre: 'Docker', categoria: 'DevOps' },
  { nombre: 'Kubernetes', categoria: 'DevOps' },
  { nombre: 'AWS', categoria: 'DevOps' },
  { nombre: 'Azure', categoria: 'DevOps' },
  { nombre: 'Google Cloud', categoria: 'DevOps' },
  { nombre: 'Git', categoria: 'DevOps' },
  { nombre: 'GitHub Actions', categoria: 'DevOps' },
  { nombre: 'Jest', categoria: 'QA' },
  { nombre: 'Cypress', categoria: 'QA' },
  { nombre: 'Selenium', categoria: 'QA' },
  // Diseño
  { nombre: 'Figma', categoria: 'Diseño' },
]

/** Formas habituales de escribir una tecnología → nombre oficial. */
const ALIAS: Record<string, string> = {
  node: 'Node.js', nodejs: 'Node.js',
  react: 'React', reactjs: 'React',
  vue: 'Vue.js', vuejs: 'Vue.js',
  next: 'Next.js', nextjs: 'Next.js',
  angularjs: 'Angular',
  js: 'JavaScript', javascript: 'JavaScript',
  ts: 'TypeScript', typescript: 'TypeScript',
  postgres: 'PostgreSQL', postgresql: 'PostgreSQL', psql: 'PostgreSQL',
  mongo: 'MongoDB',
  sqlserver: 'SQL Server', mssql: 'SQL Server',
  csharp: 'C#', 'c#': 'C#',
  dotnet: '.NET', net: '.NET', aspnet: '.NET',
  springboot: 'Spring Boot', spring: 'Spring Boot',
  reactnative: 'React Native', rn: 'React Native',
  tailwindcss: 'Tailwind',
  k8s: 'Kubernetes',
  gcp: 'Google Cloud', googlecloud: 'Google Cloud',
  golang: 'Go',
  nest: 'NestJS', nestjs: 'NestJS',
  expressjs: 'Express',
}

/** Clave para comparar sin importar mayúsculas, tildes, espacios ni puntos: «Node JS» = «node.js» = «NodeJS». */
export const claveTecnologia = (texto: string): string =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9#+]/g, '')

/**
 * Identifica la tecnología escrita: devuelve el nombre oficial si ya existe (en el catálogo, en el equipo o por alias)
 * o el texto limpio si es nueva.
 */
export const identificarTecnologia = (texto: string, conocidas: string[]): { nombre: string; nueva: boolean } => {
  const limpio = texto.trim().replace(/\s+/g, ' ')
  const clave = claveTecnologia(limpio)
  const existente = conocidas.find((t) => claveTecnologia(t) === clave)
  if (existente) return { nombre: existente, nueva: false }
  const alias = ALIAS[clave]
  if (alias) return { nombre: alias, nueva: !conocidas.includes(alias) }
  return { nombre: limpio, nueva: true }
}

/** Catálogo completo: el precargado más lo que ya registró el equipo, sin duplicados. */
export const catalogoCompleto = (enUso: string[]): string[] => {
  const nombres = CATALOGO_TECNOLOGIAS.map((t) => t.nombre)
  const claves = new Set(nombres.map(claveTecnologia))
  enUso.forEach((t) => {
    const clave = claveTecnologia(t)
    if (!claves.has(clave)) {
      claves.add(clave)
      nombres.push(t)
    }
  })
  return nombres
}

export const categoriaDe = (nombre: string): string => CATALOGO_TECNOLOGIAS.find((t) => t.nombre === nombre)?.categoria ?? 'Agregada por el equipo'
