import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { marcarListo } from './actions'
import AutoRefresh from './auto-refresh'

export const dynamic = 'force-dynamic'

export default async function CocinaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: yo } = await supabase.from('perfiles').select('rol').eq('id', user.id).single()
  if (!['cocina', 'admin'].includes(yo?.rol ?? '')) redirect('/')

  const { data: items } = await supabase
    .from('orden_items').select('id, orden_id, nombre_producto, cantidad, notas, estado, created_at')
    .in('estado', ['pendiente', 'en_preparacion', 'listo']).order('created_at')

  const ordenIds = Array.from(new Set((items ?? []).map((i) => i.orden_id)))
  let ordenes = new Map<string, { mesa_id: string | null; created_at: string }>()
  let mesaNum = new Map<string, string>()
  let mesaZona = new Map<string, string | null>()
  let zonaNom = new Map<string, string>()
  if (ordenIds.length) {
    const { data: ords } = await supabase.from('ordenes').select('id, mesa_id, created_at, estado').in('id', ordenIds)
    const validas = (ords ?? []).filter((o) => o.estado !== 'anulada')
    ordenes = new Map(validas.map((o) => [o.id, { mesa_id: o.mesa_id, created_at: o.created_at }]))
    const mesaIds = Array.from(new Set(validas.map((o) => o.mesa_id).filter(Boolean))) as string[]
    if (mesaIds.length) {
      const { data: mesas } = await supabase.from('mesas').select('id, numero, zona_id').in('id', mesaIds)
      mesaNum = new Map((mesas ?? []).map((m) => [m.id, m.numero]))
      mesaZona = new Map((mesas ?? []).map((m) => [m.id, m.zona_id]))
      const zonaIds = Array.from(new Set((mesas ?? []).map((m) => m.zona_id).filter(Boolean))) as string[]
      if (zonaIds.length) {
        const { data: zs } = await supabase.from('zonas').select('id, nombre').in('id', zonaIds)
        zonaNom = new Map((zs ?? []).map((z) => [z.id, z.nombre]))
      }
    }
  }

  const grupos = ordenIds
    .filter((oid) => ordenes.has(oid))
    .map((oid) => ({ oid, info: ordenes.get(oid)!, items: (items ?? []).filter((i) => i.orden_id === oid) }))
    .sort((a, b) => new Date(a.info.created_at).getTime() - new Date(b.info.created_at).getTime())

  return (
    <main className="min-h-screen bg-neutral-900 p-6 text-white">
      <AutoRefresh seconds={15} />
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Cocina</h1>
          <Link href="/" className="text-sm text-neutral-300 hover:underline">← Volver al panel</Link>
        </div>
        {grupos.length === 0 ? <p className="text-neutral-400">No hay pedidos en preparación.</p> : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {grupos.map((g) => {
              const mesa = g.info.mesa_id ? (mesaNum.get(g.info.mesa_id) ?? '—') : '—'
              const zId = g.info.mesa_id ? mesaZona.get(g.info.mesa_id) : null
              const area = zId ? (zonaNom.get(zId) ?? '') : ''
              const hora = new Date(g.info.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
              return (
                <div key={g.oid} className="rounded-xl bg-neutral-800 p-4">
                  <div className="mb-2 flex items-center justify-between border-b border-neutral-700 pb-2">
                    <span className="text-lg font-bold">Mesa {mesa}</span>
                    <span className="text-sm text-neutral-400">{hora}</span>
                  </div>
                  {area && <p className="mb-2 text-xs text-neutral-400">{area}</p>}
                  <ul className="space-y-2">
                    {g.items.map((it) => (
                      <li key={it.id} className="flex items-center justify-between gap-2">
                        <div>
                          <p className={it.estado === 'listo' ? 'text-green-400 line-through' : ''}>{it.cantidad} × {it.nombre_producto}</p>
                          {it.notas && <p className="text-xs text-amber-300">{it.notas}</p>}
                        </div>
                        {it.estado === 'listo' ? (
                          <span className="text-sm font-semibold text-green-400">Listo ✓</span>
                        ) : (
                          <form action={marcarListo}>
                            <input type="hidden" name="item_id" value={it.id} />
                            <button className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold hover:bg-green-700">Listo</button>
                          </form>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}