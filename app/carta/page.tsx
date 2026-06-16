import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import NuevoProducto from './nuevo-producto'
import NuevaCategoria from './nueva-categoria'
import TarjetaProducto from './tarjeta-producto'

export default async function CartaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: yo } = await supabase.from('perfiles').select('rol').eq('id', user.id).single()
  if (yo?.rol !== 'admin') redirect('/')

  const { data: categorias } = await supabase
    .from('categorias').select('id, nombre').order('orden').order('nombre')
  const { data: productos } = await supabase
    .from('productos').select('id, nombre, tipo, precio, categoria_id, disponible, controla_stock, imagen_url').order('nombre')

  const hoy = new Date().toISOString().slice(0, 10)
  const ids = (productos ?? []).map((p) => p.id)
  let stockPorProducto = new Map<string, number>()
  if (ids.length) {
    const { data: stock } = await supabase
      .from('stock_diario').select('producto_id, cantidad_actual').eq('fecha', hoy).in('producto_id', ids)
    stockPorProducto = new Map((stock ?? []).map((s) => [s.producto_id, s.cantidad_actual]))
  }

  const cats = categorias ?? []
  const catsConSin = [...cats, { id: '', nombre: 'Sin categoría' }]

  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-900">Carta y stock</h1>
          <Link href="/" className="text-sm text-neutral-600 hover:underline">← Volver al panel</Link>
        </div>

        <div className="grid gap-4">
          <NuevoProducto categorias={cats} />
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">Categorías</h2>
            <NuevaCategoria />
          </div>
        </div>

        <div className="mt-8 space-y-8">
          {catsConSin.map((c) => {
            const items = (productos ?? []).filter((p) => (p.categoria_id ?? '') === c.id)
            if (!items.length) return null
            return (
              <section key={c.id || 'sin'}>
                <h3 className="mb-3 text-lg font-bold text-neutral-800">{c.nombre}</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {items.map((p) => (
                    <TarjetaProducto
                      key={p.id}
                      id={p.id} nombre={p.nombre} tipo={p.tipo} precio={p.precio}
                      categoria_id={p.categoria_id} disponible={p.disponible}
                      controla_stock={p.controla_stock}
                      stockHoy={stockPorProducto.has(p.id) ? stockPorProducto.get(p.id)! : null}
                      imagenUrl={p.imagen_url}
                      categorias={cats}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </main>
  )
}