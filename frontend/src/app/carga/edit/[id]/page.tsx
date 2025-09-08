import { notFound } from 'next/navigation';
import EditCargaClient from './EditCargaClient';
import { generateStaticParams } from './generateStaticParams';

interface EditCargaPageProps {
  params: {
    id: string;
  };
}

export { generateStaticParams };

export default function EditCargaPage({ params }: EditCargaPageProps) {
  const { id } = params;

  // Validar que el ID existe
  if (!id) {
    notFound();
  }

  return <EditCargaClient cargaId={id} />;
}