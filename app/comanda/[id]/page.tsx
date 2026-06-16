import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BotonComanda from './boton-comanda'

export default async function ComandaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orden } = await supabase
    .from('ordenes').select('id, total, notas, created_at, mesa_id, estado').eq('id', id).single()
  if (!orden) redirect('/pedidos')

  const { data: items } = await supabase
    .from('orden_items').select('nombre_producto, cantidad, precio_unitario').eq('orden_id', id)

  let mesaNumero = '—'
  if (orden.mesa_id) {
    const { data: mesa } = await supabase.from('mesas').select('numero').eq('id', orden.mesa_id).single()
    mesaNumero = mesa?.numero ?? '—'
  }

  const fecha = new Date(orden.created_at).toLocaleString('es-PE')

  return (
    <main className="min-h-screen bg-neutral-100 p-6 print:bg-white print:p-0">
      <div className="mx-auto max-w-xs bg-white p-4 text-sm text-neutral-900 shadow print:max-w-full print:shadow-none">
        <div className="text-center">
          <h1 className="text-base font-bold">Cuyería Mirador Cusqueñitas</h1>
          <p className="text-xs text-neutral-500">Detalle del pedido</p>
        </div>
        <div className="my-3 border-t border-dashed border-neutral-300" />
        <p>Mesa: <span className="font-bold">{mesaNumero}</span></p>
        <p>Fecha: {fecha}</p>
        <div className="my-3 border-t border-dashed border-neutral-300" />
        <ul className="space-y-1">
          {(items ?? []).map((it, i) => (
            <li key={i} className="flex justify-between">
              <span>{it.cantidad} × {it.nombre_producto}</span>
              <span>S/ {(it.cantidad * Number(it.precio_unitario)).toFixed(2)}</span>
            </li>
          ))}
        </ul>
        {orden.notas && <p className="mt-2 text-xs text-neutral-500">Nota: {orden.notas}</p>}
        <div className="my-3 border-t border-dashed border-neutral-300" />
        <div className="flex justify-between text-base font-bold">
          <span>TOTAL</span><span>S/ {Number(orden.total).toFixed(2)}</span>
        </div>
        <div className="my-3 border-t border-dashed border-neutral-300" />
        <p className="text-center text-xs text-neutral-500">Conserve este detalle para su cuenta.</p>

        <BotonComanda />
      </div>
    </main>
  )
}