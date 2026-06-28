import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import CobrarBoton from './cobrar-boton'
import AnularBoton from './anular-boton'
import CerrarBoton from './cerrar-boton'
import { abrirCaja } from './actions'

export const dynamic = 'force-dynamic'

export default async function CajaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: yo } = await supabase.from('perfiles').select('rol').eq('id', user.id).single()
  if (!['cajero', 'admin'].includes(yo?.rol ?? '')) redirect('/')

  const { data: sesion } = await supabase.from('sesiones_caja').select('id, monto_inicial, abierta_en').eq('estado', 'abierta').order('abierta_en', { ascending: false }).limit(1).maybeSingle()

  if (!sesion) {
    return (
      <main className="min-h-screen bg-neutral-50 p-8">
        <div className="mx-auto max-w-md">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-neutral-900">Caja</h1>
            <Link href="/" className="text-sm text-neutral-600 hover:underline">← Volver al panel</Link>
          </div>
          <form action={abrirCaja} className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="mb-2 text-lg font-bold text-neutral-900">Abrir caja</h2>
            <p className="mb-3 text-sm text-neutral-600">Ingresa el fondo inicial: el efectivo con el que empiezas para dar vueltos.</p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-600">Fondo S/</span>
              <input name="monto_inicial" type="number" min="0" step="0.10" defaultValue="0" className="w-32 rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900" />
            </div>
            <button className="mt-3 rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800">Abrir caja</button>
          </form>
        </div>
      </main>
    )
  }

  const { data: ordenes } = await supabase.from('ordenes').select('id, total, mesa_id, created_at, notas').eq('estado', 'por_pagar').order('created_at')
  const ids = (ordenes ?? []).map((o) => o.id)
  const mesaIds = Array.from(new Set((ordenes ?? []).map((o) => o.mesa_id).filter(Boolean))) as string[]
  const itemsPorOrden = new Map<string, { nombre_producto: string; cantidad: number; precio_unitario: number }[]>()
  if (ids.length) {
    const { data: items } = await supabase.from('orden_items').select('orden_id, nombre_producto, cantidad, precio_unitario').in('orden_id', ids)
    for (const it of items ?? []) { const arr = itemsPorOrden.get(it.orden_id) ?? []; arr.push(it); itemsPorOrden.set(it.orden_id, arr) }
  }
  let mesaNum = new Map<string, string>(); let mesaZona = new Map<string, string | null>(); let zonaNom = new Map<string, string>()
  if (mesaIds.length) {
    const { data: mesas } = await supabase.from('mesas').select('id, numero, zona_id').in('id', mesaIds)
    mesaNum = new Map((mesas ?? []).map((m) => [m.id, m.numero])); mesaZona = new Map((mesas ?? []).map((m) => [m.id, m.zona_id]))
    const zIds = Array.from(new Set((mesas ?? []).map((m) => m.zona_id).filter(Boolean))) as string[]
    if (zIds.length) { const { data: zs } = await supabase.from('zonas').select('id, nombre').in('id', zIds); zonaNom = new Map((zs ?? []).map((z) => [z.id, z.nombre])) }
  }
  const totalPendiente = (ordenes ?? []).reduce((s, o) => s + Number(o.total), 0)

  const { data: ventasSes } = await supabase.from('comprobantes').select('total, metodo').eq('sesion_id', sesion.id)
  const efectivoSes = (ventasSes ?? []).filter((v) => v.metodo === 'efectivo').reduce((s, v) => s + Number(v.total), 0)
  const esperado = Number(sesion.monto_inicial) + efectivoSes

  const hoy = new Date().toISOString().slice(0, 10)
  const { data: ventas } = await supabase.from('comprobantes').select('id, serie, correlativo, total, created_at').gte('created_at', hoy).order('created_at', { ascending: false })
  const totalHoy = (ventas ?? []).reduce((s, v) => s + Number(v.total), 0)

  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-900">Caja</h1>
          <Link href="/" className="text-sm text-neutral-600 hover:underline">← Volver al panel</Link>
        </div>

        <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-neutral-500">Caja abierta desde {new Date(sesion.abierta_en).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</p>
              <p className="text-sm text-neutral-600">Fondo inicial: <span className="font-semibold">S/ {Number(sesion.monto_inicial).toFixed(2)}</span> · Cobrado efectivo: <span className="font-semibold">S/ {efectivoSes.toFixed(2)}</span></p>
              <p className="text-base font-bold text-neutral-900">Debe haber en caja: S/ {esperado.toFixed(2)}</p>
            </div>
            <CerrarBoton esperado={esperado} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-neutral-50 p-3"><p className="text-xs text-neutral-500">Por cobrar</p><p className="text-lg font-bold text-neutral-900">{(ordenes ?? []).length} · S/ {totalPendiente.toFixed(2)}</p></div>
            <div className="rounded-lg bg-neutral-50 p-3"><p className="text-xs text-neutral-500">Ventas de hoy</p><p className="text-lg font-bold text-green-700">{(ventas ?? []).length} · S/ {totalHoy.toFixed(2)}</p></div>
          </div>
        </div>

        <h2 className="mb-3 text-lg font-semibold text-neutral-800">Pedidos por cobrar</h2>
        {(ordenes ?? []).length === 0 ? <p className="text-neutral-500">No hay pedidos por cobrar.</p> : (
          <div className="grid gap-4">
            {(ordenes ?? []).map((o) => {
              const items = itemsPorOrden.get(o.id) ?? []
              const zId = o.mesa_id ? mesaZona.get(o.mesa_id) : null
              const area = zId ? (zonaNom.get(zId) ?? '') : ''
              return (
                <div key={o.id} className="rounded-xl bg-white p-5 shadow-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-neutral-900">Mesa {o.mesa_id ? (mesaNum.get(o.mesa_id) ?? '—') : '—'}</h3>
                      {area && <p className="text-xs text-neutral-500">{area}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-neutral-400">{new Date(o.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>
                      <AnularBoton ordenId={o.id} />
                    </div>
                  </div>
                  <ul className="mb-3 space-y-1 text-sm text-neutral-700">
                    {items.map((it, idx) => <li key={idx} className="flex justify-between"><span>{it.cantidad} × {it.nombre_producto}</span><span>S/ {(it.cantidad * Number(it.precio_unitario)).toFixed(2)}</span></li>)}
                  </ul>
                  {o.notas && <p className="mb-3 text-sm text-neutral-500">Nota: {o.notas}</p>}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-3">
                    <span className="text-lg font-bold text-neutral-900">Total: S/ {Number(o.total).toFixed(2)}</span>
                    <CobrarBoton ordenId={o.id} total={Number(o.total)} />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <h2 className="mb-3 mt-10 text-lg font-semibold text-neutral-800">Ventas de hoy</h2>
        {(ventas ?? []).length === 0 ? <p className="text-neutral-500">Aún no hay ventas hoy.</p> : (
          <div className="overflow-hidden rounded-lg bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-100 text-neutral-600"><tr><th className="px-4 py-2">Boleta</th><th className="px-4 py-2">Hora</th><th className="px-4 py-2">Total</th><th className="px-4 py-2"></th></tr></thead>
              <tbody>
                {(ventas ?? []).map((v) => (
                  <tr key={v.id} className="border-t border-neutral-100">
                    <td className="px-4 py-2">{v.serie}-{String(v.correlativo).padStart(5, '0')}</td>
                    <td className="px-4 py-2 text-neutral-500">{new Date(v.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="px-4 py-2 font-medium">S/ {Number(v.total).toFixed(2)}</td>
                    <td className="px-4 py-2 text-right"><Link href={`/boleta/${v.id}`} className="text-sm font-medium text-green-700 hover:underline">Reimprimir</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}