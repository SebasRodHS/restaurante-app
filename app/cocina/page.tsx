import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AutoRefresh from './auto-refresh'
import ListoBoton from './listo-boton'
import CorregirBoton from './corregir-boton'

export const dynamic = 'force-dynamic'

const esperaColor = (m: number) => (m < 5 ? 'border-green-500' : m < 15 ? 'border-amber-500' : 'border-red-500')
const esperaText = (m: number) => (m < 5 ? 'text-green-300' : m < 15 ? 'text-amber-300' : 'text-red-300')

export default async function CocinaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: yo } = await supabase.from('perfiles').select('rol').eq('id', user.id).single()
  if (!['cocina', 'admin'].includes(yo?.rol ?? '')) redirect('/')

  const { data: activos } = await supabase
    .from('orden_items').select('id, orden_id, producto_id, nombre_producto, cantidad, notas, estado, created_at')
    .in('estado', ['pendiente', 'en_preparacion', 'listo']).order('created_at')

  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const { data: entregados } = await supabase
    .from('orden_items').select('orden_id, nombre_producto, cantidad, created_at')
    .eq('estado', 'entregado').gte('created_at', hoy.toISOString()).order('created_at', { ascending: false }).limit(30)

  const ordenIds = Array.from(new Set([...(activos ?? []).map(i => i.orden_id), ...(entregados ?? []).map(i => i.orden_id)]))
  let ordenes = new Map<string, { mesa_id: string | null; created_at: string; notas: string | null }>()
  let mesaNum = new Map<string, string>(); let mesaZona = new Map<string, string | null>(); let zonaNom = new Map<string, string>()
  if (ordenIds.length) {
    const { data: ords } = await supabase.from('ordenes').select('id, mesa_id, created_at, notas, estado').in('id', ordenIds)
    const validas = (ords ?? []).filter(o => o.estado !== 'anulada')
    ordenes = new Map(validas.map(o => [o.id, { mesa_id: o.mesa_id, created_at: o.created_at, notas: o.notas }]))
    const mesaIds = Array.from(new Set(validas.map(o => o.mesa_id).filter(Boolean))) as string[]
    if (mesaIds.length) {
      const { data: mesas } = await supabase.from('mesas').select('id, numero, zona_id').in('id', mesaIds)
      mesaNum = new Map((mesas ?? []).map(m => [m.id, m.numero]))
      mesaZona = new Map((mesas ?? []).map(m => [m.id, m.zona_id]))
      const zIds = Array.from(new Set((mesas ?? []).map(m => m.zona_id).filter(Boolean))) as string[]
      if (zIds.length) { const { data: zs } = await supabase.from('zonas').select('id, nombre').in('id', zIds); zonaNom = new Map((zs ?? []).map(z => [z.id, z.nombre])) }
    }
  }
  const prodIds = Array.from(new Set((activos ?? []).map(i => i.producto_id).filter(Boolean))) as string[]
  let desc = new Map<string, string | null>()
  if (prodIds.length) { const { data: ps } = await supabase.from('productos').select('id, descripcion').in('id', prodIds); desc = new Map((ps ?? []).map(p => [p.id, p.descripcion])) }

  const grupos = ordenIds
    .filter(oid => ordenes.has(oid) && (activos ?? []).some(i => i.orden_id === oid))
    .map(oid => ({ oid, info: ordenes.get(oid)!, items: (activos ?? []).filter(i => i.orden_id === oid) }))
    .sort((a, b) => new Date(a.info.created_at).getTime() - new Date(b.info.created_at).getTime())

  const area = (mid: string | null) => { const z = mid ? mesaZona.get(mid) : null; return z ? (zonaNom.get(z) ?? '') : '' }
  const mesaTxt = (mid: string | null) => mid ? (mesaNum.get(mid) ?? '—') : '—'

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
              const min = Math.floor((Date.now() - new Date(g.info.created_at).getTime()) / 60000)
              return (
                <div key={g.oid} className={'rounded-xl border-2 bg-neutral-800 p-4 ' + esperaColor(min)}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-lg font-bold">Mesa {mesaTxt(g.info.mesa_id)}</span>
                    <span className={'text-sm font-semibold ' + esperaText(min)}>⏱ {min} min</span>
                  </div>
                  {area(g.info.mesa_id) && <p className="mb-2 text-xs text-neutral-400">{area(g.info.mesa_id)}</p>}
                  {g.info.notas && <p className="mb-2 rounded bg-amber-900/40 px-2 py-1 text-sm text-amber-200">📝 {g.info.notas}</p>}
                  <ul className="space-y-2">
                    {g.items.map((it) => (
                      <li key={it.id} className="flex items-start justify-between gap-2 border-t border-neutral-700 pt-2">
                        <div className="min-w-0">
                          <p className={'font-medium ' + (it.estado === 'listo' ? 'text-green-400 line-through' : 'text-white')}>{it.cantidad} × {it.nombre_producto}</p>
                          {it.producto_id && desc.get(it.producto_id) && <p className="text-xs text-neutral-400">{desc.get(it.producto_id)}</p>}
                          {it.notas && <p className="text-xs text-amber-300">{it.notas}</p>}
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          {it.estado === 'listo' ? <span className="text-sm font-semibold text-green-400">Listo ✓</span> : <ListoBoton itemId={it.id} />}
                          <CorregirBoton itemId={it.id} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        )}

        {(entregados ?? []).length > 0 && (
          <div className="mt-10">
            <h2 className="mb-3 text-lg font-semibold text-neutral-200">Entregados hoy</h2>
            <div className="rounded-xl bg-neutral-800 p-4">
              <ul className="divide-y divide-neutral-700 text-sm">
                {(entregados ?? []).map((it, i) => (
                  <li key={i} className="flex justify-between py-1.5 text-neutral-300">
                    <span>Mesa {mesaTxt(ordenes.get(it.orden_id)?.mesa_id ?? null)} · {it.cantidad} × {it.nombre_producto}</span>
                    <span className="text-neutral-500">{new Date(it.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}