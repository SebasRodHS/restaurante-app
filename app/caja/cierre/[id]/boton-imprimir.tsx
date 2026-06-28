'use client'
import Link from 'next/link'
export default function BotonImprimir() {
  return (
    <div className="flex gap-2">
      <button onClick={() => window.print()} className="flex-1 rounded-lg bg-neutral-900 px-4 py-2 font-semibold text-white hover:bg-neutral-800">Imprimir</button>
      <Link href="/caja" className="flex-1 rounded-lg border border-neutral-300 px-4 py-2 text-center font-semibold text-neutral-700 hover:bg-neutral-100">Volver a caja</Link>
    </div>
  )
}