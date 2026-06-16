'use client'
import { useActionState } from 'react'
import { crearProducto } from './actions'

type Cat = { id: string; nombre: string }
const inicial = { ok: false, error: null as string | null }

export default function NuevoProducto({ categorias }: { categorias: Cat[] }) {
  const [estado, action, pendiente] = useActionState(crearProducto, inicial)
  const input = "rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:border-amber-600 focus:outline-none"
  return (
    <form action={action} className="rounded-xl bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-neutral-900">Nuevo producto</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="nombre" placeholder="Nombre (ej. Cuy chactado)" className={input} />
        <select name="tipo" className={input} defaultValue="plato">
          <option value="plato">Plato</option>
          <option value="bebida">Bebida</option>
          <option value="otro">Otro</option>
        </select>
        <select name="categoria_id" className={input} defaultValue="">
          <option value="">Sin categoría</option>
          {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <input name="precio" type="number" step="0.10" min="0" placeholder="Precio (S/)" className={input} />
        <input name="descripcion" placeholder="Descripción (opcional)" className={input + ' sm:col-span-2'} />
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm text-neutral-700">
        <input type="checkbox" name="controla_stock" className="h-4 w-4" />
        Controlar stock diario (ej. 50 cuy por día)
      </label>
      {estado.error && <p className="mt-3 text-sm text-red-600">{estado.error}</p>}
      {estado.ok && <p className="mt-3 text-sm text-green-700">Producto agregado.</p>}
      <button disabled={pendiente}
        className="mt-4 rounded-lg bg-amber-700 px-4 py-2.5 font-semibold text-white hover:bg-amber-800 disabled:opacity-50">
        {pendiente ? 'Agregando…' : 'Agregar producto'}
      </button>
    </form>
  )
}