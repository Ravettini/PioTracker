'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';

interface Carga {
  id: string;
  valor: number;
  observaciones: string;
  estado: string;
  fechaCarga: string;
  indicador: {
    id: string;
    nombre: string;
    codigo: string;
  };
  usuario: {
    id: string;
    nombre: string;
    email: string;
  };
}

interface EditCargaClientProps {
  cargaId: string;
}

export default function EditCargaClient({ cargaId }: EditCargaClientProps) {
  const router = useRouter();
  const [carga, setCarga] = useState<Carga | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchCarga = async () => {
      try {
        const response = await fetch(`/api/v1/cargas/${cargaId}`);
        if (response.ok) {
          const data = await response.json();
          setCarga(data);
        } else {
          toast.error('Error al cargar la carga');
        }
      } catch (error) {
        console.error('Error:', error);
        toast.error('Error al cargar la carga');
      } finally {
        setLoading(false);
      }
    };

    fetchCarga();
  }, [cargaId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carga) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/v1/cargas/${cargaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          valor: carga.valor,
          observaciones: carga.observaciones,
          estado: carga.estado,
        }),
      });

      if (response.ok) {
        toast.success('Carga actualizada correctamente');
        router.push('/mis-envios');
      } else {
        toast.error('Error al actualizar la carga');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar la carga');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gcba-blue"></div>
      </div>
    );
  }

  if (!carga) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Carga no encontrada</h1>
          <p className="text-gray-600 mt-2">La carga que buscas no existe o no tienes permisos para verla.</p>
          <Button onClick={() => router.push('/mis-envios')} className="mt-4">
            Volver a Mis Envíos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Editar Carga</CardTitle>
            <CardDescription>
              Edita los datos de la carga para el indicador: {carga.indicador.nombre}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="indicador">Indicador</Label>
                  <Input
                    id="indicador"
                    value={carga.indicador.nombre}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <Label htmlFor="usuario">Usuario</Label>
                  <Input
                    id="usuario"
                    value={carga.usuario.nombre}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="valor">Valor</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  value={carga.valor}
                  onChange={(e) => setCarga({ ...carga, valor: parseFloat(e.target.value) })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="estado">Estado</Label>
                <Select
                  value={carga.estado}
                  onValueChange={(value) => setCarga({ ...carga, estado: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="borrador">Borrador</SelectItem>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="validado">Validado</SelectItem>
                    <SelectItem value="observado">Observado</SelectItem>
                    <SelectItem value="rechazado">Rechazado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea
                  id="observaciones"
                  value={carga.observaciones}
                  onChange={(e) => setCarga({ ...carga, observaciones: e.target.value })}
                  rows={4}
                  placeholder="Agrega observaciones sobre esta carga..."
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1"
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/mis-envios')}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
