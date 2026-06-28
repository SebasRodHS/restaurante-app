'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sun, Building2, Check, Users, Wallet, Clock } from 'lucide-react'

type Mesa = { id: string; numero: string; estado: string; zona_id: string | null; pos_x: number; pos_y: number; ocupada_desde: string | null }
type Zona = { id: string; nombre: string }

const COLORES: Record<string, { bg: string; etiqueta: string; Icono: any }> = {
  libre:     { bg: 'bg-green-600', etiqueta: 'Libre', Icono: Check },
  reservada: { bg: 'bg-amber-500', etiqueta: 'Reservada', Icono: Clock },
  ocupada:   { bg: 'bg-red-600',   etiqueta: 'Ocupada', Icono: Users },
  pagada:    { bg: 'bg-blue-600',  etiqueta: 'Pagada', Icono: Wallet },
}
const iconoZona = (n: string) => (/terraza/i.test(n) ? Sun : Building2)
function hace(desde: string | null) {
  if (!desde) return null
  const min = Math.floor((Date.now() - new Date(desde).getTime()) / 60000)
  if (min < 1) return 'recién'
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60); const m = min % 60
  return `hace ${h} h ${m} min`
}

export default function PedidosCliente({ zonas, mesas }: { zonas: Zona[]; mesas: Mesa[] }) {
  const router = useRouter()
  const [zonaSel, setZonaSel] = useState(zonas[0]?.id ?? '')
  const delArea = mesas.filter((m) => m.zona_id === zonaSel)
  const maxX = Math.max(1, ...delArea.map((m) => m.pos_x + 1))

  const counts: Record<string, number> = { libre: 0, reservada: 0, ocupada: 0, pagada: 0 }
  for (const m of mesas) if (counts[m.estado] !== undefined) counts[m.estado]++

  return (
    <div>
      {/* Leyenda con contador */}
      <div className="mb-4 flex flex-wrap gap-3">
        {Object.entries(COLORES).map(([k, c]) => {
          const I = c.Icono
          return (
            <span key={k} className="flex items-center gap-2 text-sm font-medium text-neutral-800">
              <span className={'flex h-6 w-6 items-center justify-center rounded ' + c.bg}><I className="h-3.5 w-3.5 text-white" /></span>
              {c.etiqueta} <span className="font-bold">({counts[k]})</span>
            </span>
          )
        })}
      </div>

      {/* Selector de área */}
      <div className="mb-5 flex flex-wrap gap-2">
        {zonas.map((z) => {
          const I = iconoZona(z.nombre); const activa = zonaSel === z.id
          return <button key={z.id} onClick={() => setZonaSel(z.id)} className={'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ' + (activa ? 'bg-neutral-900 text-white' : 'border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-100')}><I className="h-4 w-4" /> {z.nombre}</button>
        })}
      </div>

      {delArea.length === 0 ? <p className="text-neutral-600">No hay mesas en esta área.</p> : (
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${maxX}, minmax(0, 1fr))` }}>
          {delArea.map((m) => {
            const c = COLORES[m.estado] ?? COLORES.libre; const I = c.Icono
            const t = (m.estado === 'ocupada' || m.estado === 'pagada') ? hace(m.ocupada_desde) : null
            return (
              <button key={m.id} onClick={() => router.push(`/pedidos/${m.id}`)}
                style={{ gridColumnStart: m.pos_x + 1, gridRowStart: m.pos_y + 1 }}
                className={'flex min-h-24 flex-col items-center justify-center rounded-xl p-3 text-white shadow ' + c.bg}>
                <I className="mb-1 h-6 w-6 text-white" />
                <span className="text-xl font-extrabold text-white">Mesa {m.numero}</span>
                <span className="text-xs font-semibold text-white">{c.etiqueta}</span>
                {t && <span className="mt-1 text-xs font-semibold text-white">⏱ {t}</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}