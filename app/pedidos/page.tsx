import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PedidosCliente from './pedidos-cliente'
import AutoRefresh from '../cocina/auto-refresh'
import AvisoSonido from './../avisos/aviso-sonido'

export const dynamic = 'force-dynamic'

export default async function PedidosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: zonas } = await supabase.from('zonas').select('id, nombre').order('orden').order('nombre')
  const { data: mesas } = await supabase
    .from('mesas').select('id, numero, estado, zona_id, pos_x, pos_y, ocupada_desde')
    .order('pos_y').order('pos_x')
  const { count: avisos } = await supabase.from('notificaciones').select('id', { count: 'exact', head: true }).eq('leida', false)

  return (
    <main className="min-h-screen bg-neutral-50 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-900">Tomar pedido</h1>
          <Link href="/" className="text-sm text-neutral-600 hover:underline">← Volver al panel</Link>
        </div>
        <AutoRefresh seconds={15} />
        <div className="mb-4 flex items-center justify-between gap-3">
          <AvisoSonido count={avisos ?? 0} />
          {(avisos ?? 0) > 0 && (
            <Link href="/avisos" className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-center font-semibold text-white hover:bg-emerald-700">
              🔔 {avisos} plato(s) listo(s) para servir — ver avisos
            </Link>
          )}
        </div>
        <PedidosCliente zonas={zonas ?? []} mesas={mesas ?? []} />
      </div>
    </main>
  )
}