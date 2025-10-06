import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

// Página principal - redirige según el estado de autenticación
export default function HomePage() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;
  
  if (token) {
    redirect('/home');
  } else {
    redirect('/login');
  }
}








