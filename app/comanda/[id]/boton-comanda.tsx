'use client'
import Link from 'next/link'

export default function BotonComanda() {
  return (
    <div className="mt-4 flex gap-2 print:hidden">
      <button onClick={() => window.print()} className="flex-1 rounded-lg bg-neutral-900 px-4 py-2 font-semibold text-white hover:bg-neutral-800">
        Imprimir
      </button>
      <Link href="/pedidos" className="flex-1 rounded-lg border border-neutral-300 px-4 py-2 text-center font-semibold text-neutral-700 hover:bg-neutral-100">
        Nueva mesa
      </Link>
    </div>
  )
}