'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { anularPedido } from '../pedidos/actions'

export default function AnularBoton({ ordenId }: { ordenId: string }) {
  const router = useRouter()
  const [x, setX] = useState(false)
  async function anular() {
    const motivo = prompt('Motivo de anulación del pedido:')
    if (motivo === null) return
    setX(true)
    const fd = new FormData(); fd.set('orden_id', ordenId); fd.set('motivo', motivo || 'Sin motivo')
    await anularPedido(fd); router.refresh()
  }
  return <button onClick={anular} disabled={x} className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50">Anular</button>
}