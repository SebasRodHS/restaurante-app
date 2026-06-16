'use client'
import { crearCategoria } from './actions'

export default function NuevaCategoria() {
  return (
    <form action={crearCategoria} className="flex gap-2">
      <input name="nombre" placeholder="Nueva categoría (ej. Postres)"
        className="flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:border-amber-600 focus:outline-none" />
      <button className="rounded-lg bg-neutral-900 px-4 py-2 font-medium text-white hover:bg-neutral-800">
        Agregar
      </button>
    </form>
  )
}