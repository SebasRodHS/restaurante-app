import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { registrarGasto, eliminarGasto } from './actions'

export const dynamic = 'force-dynamic'

export default async function ReportesPage({ searchParams }: { searchParams: Promise<{ dias?: string }> }) {
  const sp = await searchParams
  const dias = [1, 7, 30].includes(Number(sp.dias)) ? Number(sp.dias) : 7

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: yo } = await supabase.from('perfiles').select('rol').eq('id', user.id).single()
  if (yo?.rol !== 'admin') redirect('/')

  const desde = new Date(); desde.setHours(0, 0, 0, 0); desde.setDate(desde.getDate() - (dias - 1))
  const desdeIso = desde.toISOString(); const desdeFecha = desde.toISOString().slice(0, 10)
  const hoyStr = new Date().toISOString().slice(0, 10)

  const { data: comps } = await supabase.from('comprobantes').select('total, created_at, orden_id').gte('created_at', desdeIso).order('created_at')
  const ventas = (comps ?? []).reduce((s, c) => s + Number(c.total), 0)
  const nPedidos = (comps ?? []).length
  const ticket = nPedidos ? ventas / nPedidos : 0

  const porDia = new Map<string, number>()
  for (const c of comps ?? []) {
    const k = new Date(c.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' })
    porDia.set(k, (porDia.get(k) ?? 0) + Number(c.total))
  }
  const diasArr = Array.from(porDia.entries())
  const maxDia = Math.max(1, ...diasArr.map(([, v]) => v))

  const ordenIds = Array.from(new Set((comps ?? []).map((c) => c.orden_id).filter(Boolean))) as string[]
  let top: { nombre: string; cantidad: number; monto: number }[] = []
  let nPlatos = 0
  if (ordenIds.length) {
    const { data: its } = await supabase.from('orden_items').select('nombre_producto, cantidad, precio_unitario, estado').in('orden_id', ordenIds).neq('estado', 'anulado')
    const agg = new Map<string, { cantidad: number; monto: number }>()
    for (const it of its ?? []) {
      const a = agg.get(it.nombre_producto) ?? { cantidad: 0, monto: 0 }
      a.cantidad += it.cantidad; a.monto += it.cantidad * Number(it.precio_unitario); nPlatos += it.cantidad
      agg.set(it.nombre_producto, a)
    }
    top = Array.from(agg.entries()).map(([nombre, a]) => ({ nombre, ...a })).sort((x, y) => y.cantidad - x.cantidad).slice(0, 10)
  }

  const { data: gastos } = await supabase.from('gastos').select('id, concepto, monto, fecha').gte('fecha', desdeFecha).order('fecha', { ascending: false })
  const totalGastos = (gastos ?? []).reduce((s, g) => s + Number(g.monto), 0)
  const ganancia = ventas - totalGastos

  const Periodo = ({ d, label }: { d: number; label: string }) => (
    <Link href={`/reportes?dias=${d}`} className={'rounded-lg px-4 py-2 text-sm font-semibold ' + (dias === d ? 'bg-neutral-900 text-white' : 'border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100')}>{label}</Link>
  )

  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-900">Reportes</h1>
          <Link href="/" className="text-sm text-neutral-600 hover:underline">← Volver al panel</Link>
        </div>

        <div className="mb-6 flex gap-2">
          <Periodo d={1} label="Hoy" /><Periodo d={7} label="7 días" /><Periodo d={30} label="30 días" />
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-white p-4 shadow-sm"><p className="text-sm text-neutral-500">Ventas</p><p className="text-xl font-bold text-neutral-900">S/ {ventas.toFixed(2)}</p></div>
          <div className="rounded-xl bg-white p-4 shadow-sm"><p className="text-sm text-neutral-500">Pedidos</p><p className="text-xl font-bold text-neutral-900">{nPedidos}</p></div>
          <div className="rounded-xl bg-white p-4 shadow-sm"><p className="text-sm text-neutral-500">Ticket prom.</p><p className="text-xl font-bold text-neutral-900">S/ {ticket.toFixed(2)}</p></div>
          <div className="rounded-xl bg-white p-4 shadow-sm"><p className="text-sm text-neutral-500">Platos vendidos</p><p className="text-xl font-bold text-neutral-900">{nPlatos}</p></div>
        </div>

        <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-neutral-900">Ventas por día</h2>
          {diasArr.length === 0 ? <p className="text-neutral-500">Sin ventas en el período.</p> : (
            <div className="space-y-2">
              {diasArr.map(([dia, val]) => (
                <div key={dia} className="flex items-center gap-3">
                  <span className="w-12 text-sm text-neutral-500">{dia}</span>
                  <div className="h-5 flex-1 rounded bg-neutral-100"><div className="h-5 rounded bg-emerald-600" style={{ width: `${(val / maxDia) * 100}%` }} /></div>
                  <span className="w-24 text-right text-sm font-medium text-neutral-700">S/ {val.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-neutral-900">Platos más vendidos</h2>
          {top.length === 0 ? <p className="text-neutral-500">Sin datos en el período.</p> : (
            <table className="w-full text-left text-sm">
              <thead className="text-neutral-500"><tr><th className="pb-2">Producto</th><th className="pb-2 text-right">Cantidad</th><th className="pb-2 text-right">Monto</th></tr></thead>
              <tbody>
                {top.map((t) => (
                  <tr key={t.nombre} className="border-t border-neutral-100"><td className="py-1.5 text-neutral-800">{t.nombre}</td><td className="py-1.5 text-right font-medium">{t.cantidad}</td><td className="py-1.5 text-right">S/ {t.monto.toFixed(2)}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-900">Gastos y ganancia</h2>
            <span className={'text-lg font-bold ' + (ganancia >= 0 ? 'text-green-700' : 'text-red-600')}>Ganancia: S/ {ganancia.toFixed(2)}</span>
          </div>
          <p className="mb-3 text-sm text-neutral-500">Ventas S/ {ventas.toFixed(2)} − Gastos S/ {totalGastos.toFixed(2)}</p>

          <form action={registrarGasto} className="mb-4 grid gap-2 sm:grid-cols-4">
            <input name="concepto" placeholder="Concepto (ej. verduras)" className="rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 sm:col-span-2" />
            <input name="monto" type="number" min="0" step="0.10" placeholder="Monto" className="rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900" />
            <input name="fecha" type="date" defaultValue={hoyStr} className="rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900" />
            <button className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800 sm:col-span-4">Registrar gasto</button>
          </form>

          {(gastos ?? []).length === 0 ? <p className="text-neutral-500">Sin gastos en el período.</p> : (
            <ul className="divide-y divide-neutral-100">
              {(gastos ?? []).map((g) => (
                <li key={g.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-neutral-700">{g.fecha} · {g.concepto}</span>
                  <span className="flex items-center gap-3">
                    <span className="font-medium text-neutral-900">S/ {Number(g.monto).toFixed(2)}</span>
                    <form action={eliminarGasto}><input type="hidden" name="id" value={g.id} /><button className="text-xs font-medium text-red-600 hover:underline">Eliminar</button></form>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  )
}