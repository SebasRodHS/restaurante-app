import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function CierresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: yo } = await supabase.from('perfiles').select('rol').eq('id', user.id).single()
  if (yo?.rol !== 'admin') redirect('/')

  const { data: sesiones } = await supabase.from('sesiones_caja').select('id, monto_inicial, monto_contado, estado, abierta_en, cerrada_en').order('abierta_en', { ascending: false }).limit(30)
  const ids = (sesiones ?? []).map((s) => s.id)
  const efectivoPorSes = new Map<string, number>()
  if (ids.length) {
    const { data: comps } = await supabase.from('comprobantes').select('sesion_id, total, metodo').in('sesion_id', ids)
    for (const c of comps ?? []) {
      if (c.metodo !== 'efectivo' || !c.sesion_id) continue
      efectivoPorSes.set(c.sesion_id, (efectivoPorSes.get(c.sesion_id) ?? 0) + Number(c.total))
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-900">Cierres de caja</h1>
          <Link href="/" className="text-sm text-neutral-600 hover:underline">← Volver al panel</Link>
        </div>
        {(sesiones ?? []).length === 0 ? <p className="text-neutral-500">Aún no hay cajas registradas.</p> : (
          <div className="overflow-hidden rounded-lg bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-100 text-neutral-600"><tr><th className="px-3 py-2">Apertura</th><th className="px-3 py-2">Estado</th><th className="px-3 py-2 text-right">Esperado</th><th className="px-3 py-2 text-right">Contado</th><th className="px-3 py-2 text-right">Dif.</th><th className="px-3 py-2"></th></tr></thead>
              <tbody>
                {(sesiones ?? []).map((s) => {
                  const esperado = Number(s.monto_inicial) + (efectivoPorSes.get(s.id) ?? 0)
                  const contado = s.monto_contado != null ? Number(s.monto_contado) : null
                  const dif = contado != null ? contado - esperado : null
                  return (
                    <tr key={s.id} className="border-t border-neutral-100">
                      <td className="px-3 py-2">{new Date(s.abierta_en).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-3 py-2">{s.estado === 'abierta' ? <span className="text-green-700">Abierta</span> : <span className="text-neutral-500">Cerrada</span>}</td>
                      <td className="px-3 py-2 text-right">S/ {esperado.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right">{contado != null ? `S/ ${contado.toFixed(2)}` : '—'}</td>
                      <td className={'px-3 py-2 text-right font-medium ' + (dif == null ? 'text-neutral-400' : dif === 0 ? 'text-green-700' : dif > 0 ? 'text-blue-700' : 'text-red-600')}>{dif == null ? '—' : (dif === 0 ? 'OK' : `${dif > 0 ? '+' : ''}${dif.toFixed(2)}`)}</td>
                      <td className="px-3 py-2 text-right"><Link href={`/caja/cierre/${s.id}`} className="text-sm font-medium text-indigo-700 hover:underline">Ver</Link></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}