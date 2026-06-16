'use client'
import { editarProducto, alternarDisponible, eliminarProducto, fijarStockHoy } from './actions'
import SubirImagen from '@/app/componentes/subir-imagen'

type Cat = { id: string; nombre: string }
type Props = {
  id: string; nombre: string; tipo: string; precio: number | string
  categoria_id: string | null; disponible: boolean; controla_stock: boolean
  stockHoy: number | null; imagenUrl: string | null; categorias: Cat[]
}

export default function TarjetaProducto(p: Props) {
  const input = "rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 focus:border-amber-600 focus:outline-none"
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <SubirImagen productoId={p.id} imagenActual={p.imagenUrl} />

      <div className="mt-3 mb-3 flex items-start justify-between gap-2">
        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold uppercase text-neutral-600">{p.tipo}</span>
        <span className={'rounded-full px-3 py-1 text-xs font-semibold ' + (p.disponible ? 'bg-green-100 text-green-800' : 'bg-neutral-200 text-neutral-600')}>
          {p.disponible ? 'Disponible' : 'No disponible'}
        </span>
      </div>

      <form action={editarProducto} className="grid gap-2">
        <input type="hidden" name="id" value={p.id} />
        <input name="nombre" defaultValue={p.nombre} className={input} />
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">S/</span>
          <input name="precio" type="number" step="0.10" min="0" defaultValue={String(p.precio)} className={input + ' w-full pl-9'} />
        </div>
        <select name="categoria_id" defaultValue={p.categoria_id ?? ''} className={input}>
          <option value="">Sin categoría</option>
          {p.categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <button className="rounded-lg bg-amber-700 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-800">
          Guardar cambios
        </button>
      </form>

      {p.controla_stock && (
        <form action={fijarStockHoy} className="mt-3 rounded-lg bg-amber-50 p-3">
          <input type="hidden" name="producto_id" value={p.id} />
          <label className="block text-sm font-medium text-amber-900">Stock de hoy</label>
          <p className="mb-2 text-xs text-amber-700">
            {p.stockHoy === null ? 'Aún no has cargado el stock de hoy.' : `Quedan ${p.stockHoy} unidades.`}
          </p>
          <div className="flex gap-2">
            <input name="cantidad" type="number" min="0" placeholder="Cantidad para hoy" className={input + ' w-full'} />
            <button className="rounded-lg bg-amber-700 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-800">Fijar</button>
          </div>
        </form>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <form action={alternarDisponible}>
          <input type="hidden" name="id" value={p.id} />
          <input type="hidden" name="disponible" value={String(p.disponible)} />
          <button className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100">
            {p.disponible ? 'Marcar no disponible' : 'Marcar disponible'}
          </button>
        </form>
        <form action={eliminarProducto}
          onSubmit={(e) => { if (!confirm(`¿Eliminar "${p.nombre}"? No se puede deshacer.`)) e.preventDefault() }}>
          <input type="hidden" name="id" value={p.id} />
          <button className="rounded-lg border-2 border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50">
            Eliminar
          </button>
        </form>
      </div>
    </div>
  )
}