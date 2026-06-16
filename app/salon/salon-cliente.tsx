'use client'
import { useState } from 'react'
import { Sun, Building2, Check, Users, Wallet, Clock } from 'lucide-react'
import { crearZona, crearMesa, asignarMesa, cambiarEstadoMesa, eliminarMesa, liberarMesa } from './actions'

type Mesa = {
  id: string; numero: string; estado: string
  zona_id: string | null; mozo_asignado_id: string | null; mozoNombre: string | null
  pos_x: number; pos_y: number; ocupada_desde: string | null
}
type Zona = { id: string; nombre: string }
type Mozo = { id: string; nombre: string }

const COLORES: Record<string, { bg: string; etiqueta: string; Icono: any }> = {
  libre:     { bg: 'bg-green-600', etiqueta: 'Libre', Icono: Check },
  reservada: { bg: 'bg-amber-500', etiqueta: 'Reservada', Icono: Clock },
  ocupada:   { bg: 'bg-red-600',   etiqueta: 'Ocupada (falta pagar)', Icono: Users },
  pagada:    { bg: 'bg-blue-600',  etiqueta: 'Pagada', Icono: Wallet },
}

const iconoZona = (nombre: string) => (/terraza/i.test(nombre) ? Sun : Building2)

function hace(desde: string | null) {
  if (!desde) return null
  const min = Math.floor((Date.now() - new Date(desde).getTime()) / 60000)
  if (min < 1) return 'recién'
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60); const m = min % 60
  return `hace ${h} h ${m} min`
}

export default function SalonCliente({
  mesas, zonas, mozos, esAdmin,
}: { mesas: Mesa[]; zonas: Zona[]; mozos: Mozo[]; esAdmin: boolean }) {
  const [zonaSel, setZonaSel] = useState<string>(zonas[0]?.id ?? '')
  const [sel, setSel] = useState<Mesa | null>(null)

  const delArea = mesas.filter((m) => m.zona_id === zonaSel)
  const maxX = Math.max(1, ...delArea.map((m) => m.pos_x + 1))
  const cerrar = () => setSel(null)
  const nombreZona = (id: string | null) => zonas.find((z) => z.id === id)?.nombre ?? 'Sin área'

  return (
    <div>
      {/* Leyenda */}
      <div className="mb-4 flex flex-wrap gap-3">
        {Object.entries(COLORES).map(([k, c]) => {
          const I = c.Icono
          return (
            <span key={k} className="flex items-center gap-2 text-sm text-neutral-700">
              <span className={'flex h-5 w-5 items-center justify-center rounded ' + c.bg}><I className="h-3 w-3 text-white" /></span>
              {c.etiqueta}
            </span>
          )
        })}
      </div>

      {/* Selector de área */}
      <div className="mb-5 flex flex-wrap gap-2">
        {zonas.map((z) => {
          const I = iconoZona(z.nombre)
          const activa = zonaSel === z.id
          return (
            <button key={z.id} onClick={() => setZonaSel(z.id)}
              className={'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ' +
                (activa ? 'bg-neutral-900 text-white' : 'border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100')}>
              <I className="h-4 w-4" /> {z.nombre}
            </button>
          )
        })}
      </div>

      {/* Croquis */}
      {delArea.length === 0 ? (
        <p className="text-neutral-500">No hay mesas en esta área.</p>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${maxX}, minmax(0, 1fr))` }}>
          {delArea.map((m) => {
            const c = COLORES[m.estado] ?? COLORES.libre
            const I = c.Icono
            const tiempo = (m.estado === 'ocupada' || m.estado === 'pagada') ? hace(m.ocupada_desde) : null
            return (
              <button key={m.id} onClick={() => setSel(m)}
                style={{ gridColumnStart: m.pos_x + 1, gridRowStart: m.pos_y + 1 }}
                className={'flex min-h-24 flex-col items-center justify-center rounded-xl p-3 text-white shadow-sm ' + c.bg}>
                <I className="mb-1 h-5 w-5" />
                <span className="text-lg font-bold">Mesa {m.numero}</span>
                <span className="text-xs opacity-90">{c.etiqueta}</span>
                {tiempo && <span className="mt-1 text-xs opacity-90">⏱ {tiempo}</span>}
                {m.mozoNombre && <span className="text-xs opacity-90">{m.mozoNombre}</span>}
              </button>
            )
          })}
        </div>
      )}

      {/* Crear (solo admin) */}
      {esAdmin && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <form action={crearMesa} className="rounded-xl bg-white p-4 shadow-sm">
            <h3 className="mb-2 font-semibold text-neutral-900">Nueva mesa</h3>
            <p className="mb-2 text-xs text-neutral-500">El número y la posición se asignan solos.</p>
            <select name="zona_id" defaultValue={zonaSel} className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900">
              {zonas.map((z) => <option key={z.id} value={z.id}>{z.nombre}</option>)}
            </select>
            <button className="mt-3 rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800">Crear mesa</button>
          </form>
          <form action={crearZona} className="rounded-xl bg-white p-4 shadow-sm">
            <h3 className="mb-2 font-semibold text-neutral-900">Nueva área</h3>
            <input name="nombre" placeholder="Ej. Terraza 3 o Piso 5" className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900" />
            <button className="mt-3 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800">Crear área</button>
          </form>
        </div>
      )}

      {/* Modal */}
      {sel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={cerrar}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-neutral-900">Mesa {sel.numero}</h2>
              <button onClick={cerrar} className="text-neutral-400 hover:text-neutral-700">✕</button>
            </div>
            <div className="space-y-1 text-sm text-neutral-700">
              <p>Área: <span className="font-medium">{nombreZona(sel.zona_id)}</span></p>
              <p>Estado: <span className="font-medium">{(COLORES[sel.estado] ?? COLORES.libre).etiqueta}</span></p>
              {(sel.estado === 'ocupada' || sel.estado === 'pagada') && hace(sel.ocupada_desde) &&
                <p>Ocupada: <span className="font-medium">{hace(sel.ocupada_desde)}</span></p>}
              <p>Mozo: <span className="font-medium">{sel.mozoNombre || 'Sin asignar'}</span></p>
            </div>

            {/* Liberar (cualquier personal) */}
            {sel.estado !== 'libre' && (
              <form action={liberarMesa} className="mt-4"
                onSubmit={(e) => { if (!confirm(`¿Liberar la Mesa ${sel.numero}? Quedará disponible.`)) e.preventDefault() }}>
                <input type="hidden" name="id" value={sel.id} />
                <button onClick={cerrar} className="w-full rounded-lg bg-green-600 px-4 py-2.5 font-semibold text-white hover:bg-green-700">
                  Liberar mesa
                </button>
              </form>
            )}

            {esAdmin && (
              <div className="mt-5 space-y-4 border-t border-neutral-200 pt-4">
                <div>
                  <p className="mb-2 text-sm font-semibold text-neutral-800">Cambiar estado</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(COLORES).map(([k, c]) => (
                      <form action={cambiarEstadoMesa} key={k}>
                        <input type="hidden" name="id" value={sel.id} />
                        <input type="hidden" name="estado" value={k} />
                        <button onClick={cerrar} className={'rounded-lg px-3 py-2 text-sm font-semibold text-white ' + c.bg}>{c.etiqueta}</button>
                      </form>
                    ))}
                  </div>
                </div>
                <form action={asignarMesa}>
                  <input type="hidden" name="id" value={sel.id} />
                  <p className="mb-2 text-sm font-semibold text-neutral-800">Asignar</p>
                  <div className="grid grid-cols-2 gap-2">
                    <select name="zona_id" defaultValue={sel.zona_id ?? ''} className="rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900">
                      <option value="">Sin área</option>
                      {zonas.map((z) => <option key={z.id} value={z.id}>{z.nombre}</option>)}
                    </select>
                    <select name="mozo_asignado_id" defaultValue={sel.mozo_asignado_id ?? ''} className="rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900">
                      <option value="">Sin mozo</option>
                      {mozos.map((mz) => <option key={mz.id} value={mz.id}>{mz.nombre}</option>)}
                    </select>
                  </div>
                  <button onClick={cerrar} className="mt-3 rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800">Guardar asignación</button>
                </form>
                <form action={eliminarMesa} onSubmit={(e) => { if (!confirm(`¿Eliminar la mesa ${sel.numero}?`)) e.preventDefault() }}>
                  <input type="hidden" name="id" value={sel.id} />
                  <button className="rounded-lg border-2 border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50">Eliminar mesa</button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}