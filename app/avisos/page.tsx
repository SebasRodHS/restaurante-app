import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { marcarEntregado } from './actions'
import AutoRefresh from '../cocina/auto-refresh'

export const dynamic = 'force-dynamic'

export default async function AvisosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: yo } = await supabase.from('perfiles').select('rol').eq('id', user.id).single()
  if (!['mozo', 'admin'].includes(yo?.rol ?? '')) redirect('/')

  const { data: notifs } = await supabase
    .from('notificaciones').select('id, mensaje, orden_item_id, created_at, destinatario_id')
    .eq('leida', false).order('created_at', { ascending: false })

  const mias = notifs ?? []

  return (
    <main className="min-h-screen bg-neutral-50 p-6">
      <AutoRefresh seconds={15} />
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-900">Avisos de cocina</h1>
          <Link href="/" className="text-sm text-neutral-600 hover:underline">← Volver al panel</Link>
        </div>
        {mias.length === 0 ? <p className="text-neutral-500">No hay platos listos por ahora.</p> : (
          <ul className="space-y-3">
            {mias.map((n) => (
              <li key={n.id} className="flex items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm">
                <div>
                  <p className="font-medium text-neutral-900">{n.mensaje}</p>
                  <p className="text-xs text-neutral-400">{new Date(n.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <form action={marcarEntregado}>
                  <input type="hidden" name="item_id" value={n.orden_item_id ?? ''} />
                  <input type="hidden" name="notif_id" value={n.id} />
                  <button className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">Entregado</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}