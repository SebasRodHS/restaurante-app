import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { marcarEntregado } from './actions'
import AutoRefresh from '../cocina/auto-refresh'
import AvisoSonido from './aviso-sonido'

export const dynamic = 'force-dynamic'

export default async function AvisosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: yo } = await supabase.from('perfiles').select('rol').eq('id', user.id).single()
  if (!['mozo', 'admin'].includes(yo?.rol ?? '')) redirect('/')

  const { data: notifs } = await supabase
    .from('notificaciones').select('id, mensaje, orden_id, orden_item_id, created_at')
    .eq('leida', false).order('created_at', { ascending: false })
  const mias = notifs ?? []

  const ordIds = Array.from(new Set(mias.map(n => n.orden_id).filter(Boolean))) as string[]
  let oMesa = new Map<string, string | null>(); let mNum = new Map<string, string>(); let mZona = new Map<string, string | null>(); let zNom = new Map<string, string>()
  if (ordIds.length) {
    const { data: ords } = await supabase.from('ordenes').select('id, mesa_id').in('id', ordIds)
    oMesa = new Map((ords ?? []).map(o => [o.id, o.mesa_id]))
    const mIds = Array.from(new Set((ords ?? []).map(o => o.mesa_id).filter(Boolean))) as string[]
    if (mIds.length) {
      const { data: ms } = await supabase.from('mesas').select('id, numero, zona_id').in('id', mIds)
      mNum = new Map((ms ?? []).map(m => [m.id, m.numero])); mZona = new Map((ms ?? []).map(m => [m.id, m.zona_id]))
      const zIds = Array.from(new Set((ms ?? []).map(m => m.zona_id).filter(Boolean))) as string[]
      if (zIds.length) { const { data: zs } = await supabase.from('zonas').select('id, nombre').in('id', zIds); zNom = new Map((zs ?? []).map(z => [z.id, z.nombre])) }
    }
  }
  const infoMesa = (ordenId: string | null) => {
    const mid = ordenId ? oMesa.get(ordenId) : null
    const num = mid ? (mNum.get(mid) ?? '—') : '—'
    const z = mid ? mZona.get(mid) : null
    const ar = z ? (zNom.get(z) ?? '') : ''
    return { num, area: ar, esTerraza: /terraza/i.test(ar) }
  }

  return (
    <main className="min-h-screen bg-neutral-50 p-6">
      <AutoRefresh seconds={15} />
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-900">Avisos de cocina</h1>
          <Link href="/" className="text-sm text-neutral-600 hover:underline">← Volver al panel</Link>
        </div>
        <div className="mb-4"><AvisoSonido count={mias.length} /></div>
        {mias.length === 0 ? <p className="text-neutral-500">No hay platos listos por ahora.</p> : (
          <ul className="space-y-3">
            {mias.map((n) => {
              const im = infoMesa(n.orden_id)
              return (
                <li key={n.id} className="flex items-center justify-between gap-3 rounded-xl border-l-4 border-green-500 bg-white p-4 shadow-sm">
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className={'rounded-full px-2 py-0.5 text-xs font-bold text-white ' + (im.esTerraza ? 'bg-amber-600' : 'bg-indigo-600')}>{im.area || 'Área —'}</span>
                      <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-xs font-bold text-white">Mesa {im.num}</span>
                    </div>
                    <p className="font-medium text-neutral-900">{n.mensaje}</p>
                    <p className="text-xs text-neutral-400">{new Date(n.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <form action={marcarEntregado}>
                    <input type="hidden" name="item_id" value={n.orden_item_id ?? ''} />
                    <input type="hidden" name="notif_id" value={n.id} />
                    <button className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">Entregado</button>
                  </form>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </main>
  )
}