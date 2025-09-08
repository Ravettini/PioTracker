// Función requerida para Next.js con output: 'export'
export async function generateStaticParams() {
  // Para páginas dinámicas con output: 'export', necesitamos retornar un array vacío
  // ya que no podemos pre-generar todas las rutas posibles
  return [];
}
