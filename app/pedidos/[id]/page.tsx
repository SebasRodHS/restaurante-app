import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Constructor from './constructor'

export const dynamic = 'force-dynamic'

export default async function NuevoPedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: mesa } = await supabase.from('mesas').select('id, numero, estado, ocupada_desde, zona_id').eq('id', id).single()
  if (!mesa) redirect('/pedidos')

  let areaNombre = 'Sin área'
  if (mesa.zona_id) {
    const { data: z } = await supabase.from('zonas').select('nombre').eq('id', mesa.zona_id).single()
    areaNombre = z?.nombre ?? 'Sin área'
  }

  const { data: ordenAbierta } = await supabase
    .from('ordenes').select('id, total').eq('mesa_id', id).eq('estado', 'por_pagar')
    .order('created_at', { ascending: true }).limit(1).maybeSingle()

  let yaPedido: { id: string; nombre_producto: string; cantidad: number; precio_unitario: number }[] = []
  if (ordenAbierta) {
    const { data: its } = await supabase.from('orden_items').select('id, nombre_producto, cantidad, precio_unitario, estado').eq('orden_id', ordenAbierta.id).neq('estado', 'anulado')
    yaPedido = its ?? []
  }

  const { data: categorias } = await supabase.from('categorias').select('id, nombre').order('nombre')
  const { data: productos } = await supabase
    .from('productos').select('id, nombre, tipo, precio, descripcion, categoria_id, controla_stock, imagen_url').eq('disponible', true).order('nombre')

  const hoy = new Date().toISOString().slice(0, 10)
  const ids = (productos ?? []).map((p) => p.id)
  let stock = new Map<string, number>()
  if (ids.length) {
    const { data: s } = await supabase.from('stock_diario').select('producto_id, cantidad_actual').eq('fecha', hoy).in('producto_id', ids)
    stock = new Map((s ?? []).map((r) => [r.producto_id, r.cantidad_actual]))
  }
  const prods = (productos ?? []).map((p) => ({
    id: p.id, nombre: p.nombre, tipo: p.tipo, precio: p.precio, descripcion: p.descripcion, categoria_id: p.categoria_id,
    imagen_url: p.imagen_url, controla_stock: p.controla_stock, stock: p.controla_stock ? (stock.get(p.id) ?? 0) : null,
  }))

  return (
    <main className="min-h-screen bg-neutral-50 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-900">Pedido — Mesa {mesa.numero}</h1>
          <Link href="/pedidos" className="text-sm text-neutral-600 hover:underline">← Volver</Link>
        </div>
        <Constructor
          mesaId={mesa.id} mesaNumero={mesa.numero} areaNombre={areaNombre}
          estado={mesa.estado} ocupadaDesde={mesa.ocupada_desde}
          yaPedido={yaPedido} totalPrevio={Number(ordenAbierta?.total ?? 0)}
          ordenAbiertaId={ordenAbierta?.id ?? null} productos={prods} categorias={categorias ?? []}
        />
      </div>
    </main>
  )
}