'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cobrarEfectivo } from './actions'

function sugerencias(total: number): number[] {
  const opts = new Set<number>()
  opts.add(Math.round(total * 100) / 100)
  for (const d of [5, 10, 20, 50, 100, 200]) {
    const up = Math.ceil(total / d) * d
    if (up >= total) opts.add(up)
  }
  return Array.from(opts).sort((a, b) => a - b).slice(0, 5)
}

export default function CobrarBoton({ ordenId, total }: { ordenId: string; total: number }) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [recibido, setRecibido] = useState('')
  const [cobrando, setCobrando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const rec = Number(recibido) || 0
  const vuelto = rec - total

  async function cobrar() {
    if (cobrando) return
    if (rec < total) { setError('El monto recibido no cubre el total.'); return }
    setCobrando(true); setError(null)
    const r = await cobrarEfectivo(ordenId, rec)
    if (!r.ok) { setCobrando(false); setError(r.error || 'Error'); return }
    router.push(`/boleta/${r.comprobanteId}`)
  }

  if (!abierto) return <button onClick={() => setAbierto(true)} className="rounded-lg bg-green-600 px-4 py-2.5 font-semibold text-white hover:bg-green-700">Cobrar</button>

  return (
    <div className="w-full">
      <div className="mb-2 flex flex-wrap gap-2">
        {sugerencias(total).map((s) => (
          <button key={s} onClick={() => setRecibido(String(s))} className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100">
            {s === Math.round(total * 100) / 100 ? 'Exacto' : `S/ ${s.toFixed(2)}`}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-neutral-600">Recibe S/</span>
        <input type="number" min="0" step="0.10" value={recibido} onChange={(e) => setRecibido(e.target.value)} autoFocus className="w-28 rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900" placeholder="0.00" />
      </div>
      <p className={'mt-1 text-sm font-semibold ' + (vuelto >= 0 ? 'text-green-700' : 'text-red-600')}>Vuelto: S/ {(vuelto >= 0 ? vuelto : 0).toFixed(2)}</p>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      <div className="mt-2 flex gap-2">
        <button onClick={cobrar} disabled={cobrando} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">{cobrando ? 'Cobrando…' : 'Confirmar cobro'}</button>
        <button onClick={() => setAbierto(false)} className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700">Cancelar</button>
      </div>
    </div>
  )
}