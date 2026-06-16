import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BotonImprimir from './boton-imprimir'

export default async function BoletaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: comp } = await supabase.from('comprobantes')
    .select('id, serie, correlativo, total, subtotal, igv, recibido, vuelto, metodo, created_at, orden_id').eq('id', id).single()
  if (!comp) redirect('/caja')

  const { data: items } = await supabase.from('orden_items').select('nombre_producto, cantidad, precio_unitario').eq('orden_id', comp.orden_id)
  const { data: orden } = await supabase.from('ordenes').select('mesa_id').eq('id', comp.orden_id).single()
  let mesaNumero = '—'; let areaNombre = '—'
  if (orden?.mesa_id) {
    const { data: mesa } = await supabase.from('mesas').select('numero, zona_id').eq('id', orden.mesa_id).single()
    mesaNumero = mesa?.numero ?? '—'
    if (mesa?.zona_id) { const { data: z } = await supabase.from('zonas').select('nombre').eq('id', mesa.zona_id).single(); areaNombre = z?.nombre ?? '—' }
  }
  const fecha = new Date(comp.created_at).toLocaleString('es-PE')

  return (
    <main className="min-h-screen bg-neutral-100 p-6 print:bg-white print:p-0">
      <div className="mx-auto max-w-xs bg-white p-4 text-sm text-neutral-900 shadow print:max-w-full print:shadow-none">
        <div className="text-center"><h1 className="text-base font-bold">Cuyería Mirador Cusqueñitas</h1><p className="text-xs text-neutral-500">Ticket de venta interno</p></div>
        <div className="my-3 border-t border-dashed border-neutral-300" />
        <p>Comprobante: {comp.serie}-{String(comp.correlativo).padStart(5, '0')}</p>
        <p>Fecha: {fecha}</p>
        <p>Área: {areaNombre}</p>
        <p>Mesa: {mesaNumero}</p>
        <p>Pago: Efectivo</p>
        <div className="my-3 border-t border-dashed border-neutral-300" />
        <ul className="space-y-1">
          {(items ?? []).map((it, i) => <li key={i} className="flex justify-between"><span>{it.cantidad} × {it.nombre_producto}</span><span>S/ {(it.cantidad * Number(it.precio_unitario)).toFixed(2)}</span></li>)}
        </ul>
        <div className="my-3 border-t border-dashed border-neutral-300" />
        <div className="flex justify-between"><span>Op. gravada</span><span>S/ {Number(comp.subtotal).toFixed(2)}</span></div>
        <div className="flex justify-between"><span>IGV (18%)</span><span>S/ {Number(comp.igv).toFixed(2)}</span></div>
        <div className="mt-1 flex justify-between text-base font-bold"><span>TOTAL</span><span>S/ {Number(comp.total).toFixed(2)}</span></div>
        {comp.recibido != null && (
          <>
            <div className="mt-1 flex justify-between"><span>Recibido</span><span>S/ {Number(comp.recibido).toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Vuelto</span><span>S/ {Number(comp.vuelto).toFixed(2)}</span></div>
          </>
        )}
        <div className="my-3 border-t border-dashed border-neutral-300" />
        <p className="text-center text-xs text-neutral-500">¡Gracias por su visita!</p>
        <div className="mt-4 print:hidden"><BotonImprimir /></div>
      </div>
    </main>
  )
}