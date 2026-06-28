'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { crearPedido, liberarMesaPedido, anularItem, anularPedido } from '../actions'

type Prod = { id: string; nombre: string; tipo: string; precio: number; descripcion: string | null; categoria_id: string | null; imagen_url: string | null; controla_stock: boolean; stock: number | null }
type Item = { producto_id: string; nombre: string; precio: number; cantidad: number }
type Ya = { id: string; nombre_producto: string; cantidad: number; precio_unitario: number }
type Cat = { id: string; nombre: string }

const COLOR_ESTADO: Record<string, string> = { libre: 'text-green-700', reservada: 'text-amber-700', ocupada: 'text-red-700', pagada: 'text-blue-700' }
const ETIQUETA: Record<string, string> = { libre: 'Libre', reservada: 'Reservada', ocupada: 'Ocupada (falta pagar)', pagada: 'Pagada' }
function hace(desde: string | null) {
  if (!desde) return null
  const min = Math.floor((Date.now() - new Date(desde).getTime()) / 60000)
  if (min < 1) return 'recién'
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60); const m = min % 60
  return `hace ${h} h ${m} min`
}

export default function Constructor({
  mesaId, mesaNumero, areaNombre, estado, ocupadaDesde, yaPedido, totalPrevio, ordenAbiertaId, productos, categorias,
}: {
  mesaId: string; mesaNumero: string; areaNombre: string; estado: string; ocupadaDesde: string | null
  yaPedido: Ya[]; totalPrevio: number; ordenAbiertaId: string | null; productos: Prod[]; categorias: Cat[]
}) {
  const router = useRouter()
  const [cart, setCart] = useState<Item[]>([])
  const [nota, setNota] = useState('')
  const [cat, setCat] = useState<string>('todas')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState<Prod | null>(null)
  const [liberando, setLiberando] = useState(false)

  function sumar(it: Item) {
    setCart((c) => {
      const ex = c.find((i) => i.producto_id === it.producto_id)
      if (ex) return c.map((i) => i.producto_id === it.producto_id ? { ...i, cantidad: i.cantidad + 1 } : i)
      return [...c, it]
    })
  }
  function restar(id: string) {
    setCart((c) => c.flatMap((i) => i.producto_id === id ? (i.cantidad > 1 ? [{ ...i, cantidad: i.cantidad - 1 }] : []) : [i]))
  }
  function quitar(id: string) { setCart((c) => c.filter((i) => i.producto_id !== id)) }

  const totalNuevo = cart.reduce((s, i) => s + i.precio * i.cantidad, 0)
  const totalItems = cart.reduce((s, i) => s + i.cantidad, 0)
  const hayPrevio = yaPedido.length > 0
  const visibles = cat === 'todas' ? productos : productos.filter((p) => p.categoria_id === cat)

  async function enviar() {
    if (!cart.length || enviando) return
    setEnviando(true); setError(null)
    const r = await crearPedido({ mesaId, nota, items: cart })
    setEnviando(false)
    if (!r.ok) { setError(r.error || 'Error'); return }
    router.push(`/comanda/${r.ordenId}`)
  }
  async function liberar() {
    if (!confirm(`¿Liberar la Mesa ${mesaNumero}? Quedará disponible.`)) return
    setLiberando(true); await liberarMesaPedido(mesaId); router.push('/pedidos')
  }
  async function anular(itemId: string) {
    const motivo = prompt('Motivo de anulación del plato:')
    if (motivo === null) return
    const fd = new FormData(); fd.set('item_id', itemId); fd.set('motivo', motivo || 'Sin motivo')
    await anularItem(fd); router.refresh()
  }
  async function anularTodo() {
    if (!ordenAbiertaId) return
    const motivo = prompt('Motivo de anulación del pedido completo:')
    if (motivo === null) return
    const fd = new FormData(); fd.set('orden_id', ordenAbiertaId); fd.set('motivo', motivo || 'Sin motivo')
    await anularPedido(fd); router.push('/pedidos')
  }

  return (
    <div className="pb-28 lg:pb-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm">
        <div>
          <p className="text-sm text-neutral-600">{areaNombre}</p>
          <p className={'font-bold ' + (COLOR_ESTADO[estado] ?? 'text-neutral-800')}>{ETIQUETA[estado] ?? estado}</p>
          {(estado === 'ocupada' || estado === 'pagada') && hace(ocupadaDesde) && <p className="text-sm text-neutral-600">Ocupada {hace(ocupadaDesde)}</p>}
        </div>
        <div className="flex gap-2">
          {ordenAbiertaId && (
            <button onClick={() => router.push(`/comanda/${ordenAbiertaId}`)} className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-100">Reimprimir comanda</button>
          )}
          {estado !== 'libre' && (
            <button onClick={liberar} disabled={liberando} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">{liberando ? 'Liberando…' : 'Liberar mesa'}</button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-bold text-neutral-900">Menú</h2>
          {/* Categorías */}
          <div className="mb-3 flex flex-wrap gap-2">
            <button onClick={() => setCat('todas')} className={'rounded-lg px-3 py-1.5 text-sm font-semibold ' + (cat === 'todas' ? 'bg-neutral-900 text-white' : 'border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-100')}>Todas</button>
            {categorias.map((c) => (
              <button key={c.id} onClick={() => setCat(c.id)} className={'rounded-lg px-3 py-1.5 text-sm font-semibold ' + (cat === c.id ? 'bg-neutral-900 text-white' : 'border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-100')}>{c.nombre}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {visibles.map((p) => {
              const agotado = p.controla_stock && (p.stock ?? 0) <= 0
              const qty = cart.find((i) => i.producto_id === p.id)?.cantidad ?? 0
              return (
                <div key={p.id} className={'relative overflow-hidden rounded-xl border bg-white ' + (qty > 0 ? 'border-amber-500 ring-2 ring-amber-200' : 'border-neutral-200')}>
                  {qty > 0 && <span className="absolute right-1 top-1 z-10 rounded-full bg-amber-700 px-2 py-0.5 text-xs font-bold text-white">x{qty}</span>}
                  <button type="button" onClick={() => setZoom(p)} className="block aspect-square w-full bg-neutral-100">
                    {p.imagen_url ? <img src={p.imagen_url} alt={p.nombre} className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center text-xs text-neutral-500">Sin foto</span>}
                  </button>
                  <div className="p-2">
                    <p className="truncate text-sm font-semibold text-neutral-900">{p.nombre}</p>
                    {p.descripcion && <p className="mt-0.5 line-clamp-2 text-xs text-neutral-600">{p.descripcion}</p>}
                    <p className="mt-1 text-sm font-medium text-neutral-800">S/ {Number(p.precio).toFixed(2)}</p>
                    {p.controla_stock && <p className="text-xs font-medium text-amber-700">{agotado ? 'Agotado' : `Quedan ${p.stock}`}</p>}
                    <button disabled={agotado} onClick={() => sumar({ producto_id: p.id, nombre: p.nombre, precio: Number(p.precio), cantidad: 1 })}
                      className="mt-2 w-full rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">{qty > 0 ? `Agregar (${qty})` : 'Agregar'}</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div>
          {hayPrevio && (
            <div className="mb-4 rounded-xl bg-white p-4 shadow-sm">
              <h2 className="mb-2 text-lg font-bold text-neutral-900">Ya pedido</h2>
              <ul className="space-y-1 text-sm text-neutral-800">
                {yaPedido.map((it) => (
                  <li key={it.id} className="flex items-center justify-between gap-2">
                    <span>{it.cantidad} × {it.nombre_producto}</span>
                    <span className="flex items-center gap-3">
                      <span>S/ {(it.cantidad * Number(it.precio_unitario)).toFixed(2)}</span>
                      <button onClick={() => anular(it.id)} className="text-xs font-medium text-red-600 hover:underline">Anular</button>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex justify-between border-t border-neutral-200 pt-2 text-sm font-bold text-neutral-900"><span>Subtotal ya pedido</span><span>S/ {totalPrevio.toFixed(2)}</span></div>
              {ordenAbiertaId && <button onClick={anularTodo} className="mt-3 w-full rounded-lg border-2 border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50">Anular pedido completo</button>}
            </div>
          )}

          <div className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-lg font-bold text-neutral-900">{hayPrevio ? 'Agregar más' : 'Nuevo pedido'}</h2>
            {cart.length === 0 ? <p className="text-neutral-600">Toca "Agregar" en los productos del menú.</p> : (
              <ul className="space-y-2">
                {cart.map((i) => (
                  <li key={i.producto_id} className="flex items-center justify-between gap-2">
                    <span className="text-neutral-900">{i.nombre}</span>
                    <span className="flex items-center gap-2">
                      <button onClick={() => restar(i.producto_id)} className="h-7 w-7 rounded-full bg-neutral-200 font-bold text-neutral-800">−</button>
                      <span className="w-6 text-center text-neutral-900">{i.cantidad}</span>
                      <button onClick={() => sumar({ producto_id: i.producto_id, nombre: i.nombre, precio: i.precio, cantidad: 1 })} className="h-7 w-7 rounded-full bg-neutral-200 font-bold text-neutral-800">+</button>
                      <span className="w-16 text-right font-medium text-neutral-900">S/ {(i.precio * i.cantidad).toFixed(2)}</span>
                      <button onClick={() => quitar(i.producto_id)} title="Quitar" className="text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <textarea value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Nota (ej. sin ají)" className="mt-4 w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900" rows={2} />
            <div className="mt-3 flex items-center justify-between border-t border-neutral-200 pt-3"><span className="text-lg font-bold text-neutral-900">A agregar</span><span className="text-lg font-bold text-neutral-900">S/ {totalNuevo.toFixed(2)}</span></div>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            <button onClick={enviar} disabled={!cart.length || enviando} className="mt-4 w-full rounded-lg bg-amber-700 px-4 py-3 font-semibold text-white hover:bg-amber-800 disabled:opacity-50">{enviando ? 'Enviando…' : (hayPrevio ? 'Agregar al pedido' : 'Enviar pedido')}</button>
          </div>
        </div>
      </div>

      {/* Barra fija en celular: muestra que se está agregando */}
      {cart.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white p-3 shadow-lg lg:hidden">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
            <span className="font-bold text-neutral-900">{totalItems} ítem(s) · S/ {totalNuevo.toFixed(2)}</span>
            <button onClick={enviar} disabled={enviando} className="rounded-lg bg-amber-700 px-5 py-2.5 font-semibold text-white disabled:opacity-50">{enviando ? 'Enviando…' : (hayPrevio ? 'Agregar' : 'Enviar')}</button>
          </div>
        </div>
      )}

      {zoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setZoom(null)}>
          <div className="max-w-lg" onClick={(e) => e.stopPropagation()}>
            {zoom.imagen_url ? <img src={zoom.imagen_url} alt={zoom.nombre} className="max-h-[70vh] w-full rounded-xl object-contain" /> : <div className="flex h-48 items-center justify-center rounded-xl bg-neutral-800 text-neutral-400">Sin foto</div>}
            <p className="mt-3 text-center text-lg font-bold text-white">{zoom.nombre}</p>
            {zoom.descripcion && <p className="mt-1 text-center text-sm text-neutral-200">{zoom.descripcion}</p>}
            <p className="mt-1 text-center text-white">S/ {Number(zoom.precio).toFixed(2)}</p>
            <div className="mt-3 flex justify-center gap-2">
              <button onClick={() => { sumar({ producto_id: zoom.id, nombre: zoom.nombre, precio: Number(zoom.precio), cantidad: 1 }); setZoom(null) }} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">Agregar</button>
              <button onClick={() => setZoom(null)} className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-neutral-800">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}