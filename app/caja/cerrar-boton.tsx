'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cerrarCaja } from './actions'

export default function CerrarBoton({ esperado }: { esperado: number }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [contado, setContado] = useState('')
  const [notas, setNotas] = useState('')
  const [x, setX] = useState(false)
  const dif = (Number(contado) || 0) - esperado

  async function cerrar() {
    if (!confirm('¿Cerrar la caja?')) return
    setX(true)
    const fd = new FormData(); fd.set('monto_contado', String(Number(contado) || 0)); fd.set('notas', notas)
    const r = await cerrarCaja(fd)
    if (r?.ok && r.sesionId) router.push(`/caja/cierre/${r.sesionId}`)
    else setX(false)
  }

  if (!open) return <button onClick={() => setOpen(true)} className="rounded-lg bg-neutral-800 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700">Cerrar caja</button>

  return (
    <div className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-4">
      <p className="mb-2 font-semibold text-neutral-900">Cerrar caja</p>
      <p className="mb-2 text-sm text-neutral-600">Debe haber en caja: <span className="font-bold">S/ {esperado.toFixed(2)}</span></p>
      <label className="text-sm text-neutral-600">¿Cuánto contaste? S/</label>
      <input type="number" min="0" step="0.10" value={contado} onChange={(e) => setContado(e.target.value)} className="mt-1 block w-32 rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900" />
      {contado !== '' && (
        <p className={'mt-1 text-sm font-semibold ' + (dif === 0 ? 'text-green-700' : dif > 0 ? 'text-blue-700' : 'text-red-600')}>
          {dif === 0 ? 'Cuadra exacto' : dif > 0 ? `Sobran S/ ${dif.toFixed(2)}` : `Faltan S/ ${(-dif).toFixed(2)}`}
        </p>
      )}
      <textarea value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Notas (opcional)" rows={2} className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900" />
      <div className="mt-2 flex gap-2">
        <button onClick={cerrar} disabled={x} className="rounded-lg bg-neutral-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{x ? 'Cerrando…' : 'Confirmar cierre'}</button>
        <button onClick={() => setOpen(false)} className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700">Cancelar</button>
      </div>
    </div>
  )
}