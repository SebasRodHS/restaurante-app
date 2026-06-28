'use client'
import { useRouter } from 'next/navigation'
import { marcarListo } from './actions'

export default function ListoBoton({ itemId }: { itemId: string }) {
  const router = useRouter()
  async function go() {
    if (!confirm('¿Marcar este plato como LISTO y avisar al mozo?')) return
    const fd = new FormData(); fd.set('item_id', itemId)
    await marcarListo(fd); router.refresh()
  }
  return <button onClick={go} className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700">Listo</button>
}