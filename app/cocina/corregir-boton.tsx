'use client'
import { useRouter } from 'next/navigation'
import { anularItem } from '../pedidos/actions'

export default function CorregirBoton({ itemId }: { itemId: string }) {
  const router = useRouter()
  async function go() {
    const motivo = prompt('Corregir/quitar este plato. Motivo (ej. error de digitación):')
    if (motivo === null) return
    const fd = new FormData(); fd.set('item_id', itemId); fd.set('motivo', motivo || 'Corrección de cocina')
    await anularItem(fd); router.refresh()
  }
  return <button onClick={go} className="rounded-lg border border-red-400 px-2 py-1 text-xs font-medium text-red-300 hover:bg-red-900/40">Corregir</button>
}