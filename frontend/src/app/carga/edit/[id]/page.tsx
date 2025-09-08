import { notFound } from 'next/navigation';
import EditCargaClient from './EditCargaClient';

// Función requerida para Next.js con output: 'export'
export async function generateStaticParams() {
  // Para páginas dinámicas con output: 'export', necesitamos retornar un array vacío
  // ya que no podemos pre-generar todas las rutas posibles
  return [];
}

interface EditCargaPageProps {
  params: {
    id: string;
  };
}

export default function EditCargaPage({ params }: EditCargaPageProps) {
  const { id } = params;

  // Validar que el ID existe
  if (!id) {
    notFound();
  }

  return <EditCargaClient cargaId={id} />;
}