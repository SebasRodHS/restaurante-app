import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SalonCliente from './salon-cliente'

export default async function SalonPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: yo } = await supabase.from('perfiles').select('rol').eq('id', user.id).single()
  const esAdmin = yo?.rol === 'admin'

  const { data: zonas } = await supabase.from('zonas').select('id, nombre').order('orden').order('nombre')
  const { data: mozos } = await supabase.from('perfiles').select('id, nombre').eq('rol', 'mozo').order('nombre')
  const { data: mesas } = await supabase
    .from('mesas').select('id, numero, estado, zona_id, mozo_asignado_id, pos_x, pos_y, ocupada_desde')
    .order('pos_y').order('pos_x')

  const mozoNombre = new Map((mozos ?? []).map((m) => [m.id, m.nombre]))
  const mesasEnriq = (mesas ?? []).map((m) => ({
    ...m,
    mozoNombre: m.mozo_asignado_id ? (mozoNombre.get(m.mozo_asignado_id) ?? null) : null,
  }))

  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-900">Salón</h1>
          <Link href="/" className="text-sm text-neutral-600 hover:underline">← Volver al panel</Link>
        </div>
        <SalonCliente mesas={mesasEnriq} zonas={zonas ?? []} mozos={mozos ?? []} esAdmin={esAdmin} />
      </div>
    </main>
  )
}