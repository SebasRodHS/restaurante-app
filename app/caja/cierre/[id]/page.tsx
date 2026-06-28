import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BotonImprimir from './boton-imprimir'

export default async function CierrePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: yo } = await supabase.from('perfiles').select('rol').eq('id', user.id).single()
  if (!['cajero', 'admin'].includes(yo?.rol ?? '')) redirect('/')

  const { data: ses } = await supabase.from('sesiones_caja').select('*').eq('id', id).single()
  if (!ses) redirect('/caja')

  const { data: comps } = await supabase.from('comprobantes').select('id, serie, correlativo, total, metodo, created_at').eq('sesion_id', id).order('created_at')
  const efectivo = (comps ?? []).filter((c) => c.metodo === 'efectivo').reduce((s, c) => s + Number(c.total), 0)
  const totalVentas = (comps ?? []).reduce((s, c) => s + Number(c.total), 0)
  const esperado = Number(ses.monto_inicial) + efectivo
  const contado = ses.monto_contado != null ? Number(ses.monto_contado) : null
  const dif = contado != null ? contado - esperado : null

  return (
    <main className="min-h-screen bg-neutral-100 p-6 print:bg-white print:p-0">
      <div className="mx-auto max-w-md bg-white p-5 text-sm text-neutral-900 shadow print:max-w-full print:shadow-none">
        <h1 className="text-center text-lg font-bold">Cierre de caja</h1>
        <p className="text-center text-xs text-neutral-500">Cuyería Mirador Cusqueñitas</p>
        <div className="my-3 border-t border-dashed border-neutral-300" />
        <p>Apertura: {new Date(ses.abierta_en).toLocaleString('es-PE')}</p>
        {ses.cerrada_en && <p>Cierre: {new Date(ses.cerrada_en).toLocaleString('es-PE')}</p>}
        <div className="my-3 border-t border-dashed border-neutral-300" />
        <div className="flex justify-between"><span>Fondo inicial</span><span>S/ {Number(ses.monto_inicial).toFixed(2)}</span></div>
        <div className="flex justify-between"><span>Ventas en efectivo</span><span>S/ {efectivo.toFixed(2)}</span></div>
        <div className="mt-1 flex justify-between font-bold"><span>Debe haber en caja</span><span>S/ {esperado.toFixed(2)}</span></div>
        {contado != null && (
          <>
            <div className="mt-1 flex justify-between"><span>Contado</span><span>S/ {contado.toFixed(2)}</span></div>
            <div className={'flex justify-between font-bold ' + (dif === 0 ? 'text-green-700' : (dif ?? 0) > 0 ? 'text-blue-700' : 'text-red-600')}>
              <span>Diferencia</span><span>{dif === 0 ? 'Cuadra' : (dif ?? 0) > 0 ? `Sobran S/ ${(dif ?? 0).toFixed(2)}` : `Faltan S/ ${(-(dif ?? 0)).toFixed(2)}`}</span>
            </div>
          </>
        )}
        {ses.notas && <p className="mt-2 text-xs text-neutral-500">Notas: {ses.notas}</p>}
        <div className="my-3 border-t border-dashed border-neutral-300" />
        <p className="mb-1 font-semibold">Ventas de la sesión ({(comps ?? []).length})</p>
        <ul className="space-y-1">
          {(comps ?? []).map((c) => (
            <li key={c.id} className="flex justify-between"><span>{c.serie}-{String(c.correlativo).padStart(5, '0')} · {new Date(c.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span><span>S/ {Number(c.total).toFixed(2)}</span></li>
          ))}
        </ul>
        <div className="mt-1 flex justify-between border-t border-neutral-200 pt-1 font-bold"><span>Total vendido</span><span>S/ {totalVentas.toFixed(2)}</span></div>
        <div className="mt-4 print:hidden"><BotonImprimir /></div>
      </div>
    </main>
  )
}