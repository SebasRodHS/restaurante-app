'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Producto = { id: string; nombre: string; precio: number; tipo: string }

export default function Home() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    supabase
      .from('productos')
      .select('id, nombre, precio, tipo')
      .order('nombre')
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setProductos(data ?? [])
        setCargando(false)
      })
  }, [])

  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <h1 className="text-2xl font-bold text-neutral-800 mb-6">Carta</h1>

      {cargando && <p className="text-neutral-500">Cargando…</p>}
      {error && <p className="text-red-600">Error: {error}</p>}

      <ul className="max-w-md space-y-2">
        {productos.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between rounded-lg bg-white px-4 py-3 shadow-sm"
          >
            <span>
              <span className="font-medium text-neutral-800">{p.nombre}</span>
              <span className="ml-2 text-xs uppercase text-neutral-400">{p.tipo}</span>
            </span>
            <span className="font-semibold text-neutral-700">
              S/ {Number(p.precio).toFixed(2)}
            </span>
          </li>
        ))}
      </ul>
    </main>
  )
}