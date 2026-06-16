'use client'
import { alternarActivo, eliminarUsuario } from './actions'
import AvatarRol from './avatar-rol'

type Props = {
  id: string; nombre: string; email: string; rol: string; activo: boolean; esYo: boolean
}

export default function TarjetaUsuario({ id, nombre, email, rol, activo, esYo }: Props) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <AvatarRol rol={rol} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold text-neutral-900">{nombre || 'Sin nombre'}</p>
          <p className="truncate text-sm text-neutral-500">{email || '—'}</p>
          <span className="mt-1 inline-block rounded-full bg-neutral-100 px-3 py-0.5 text-xs font-semibold uppercase text-neutral-600">
            {rol}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span className={
          'rounded-full px-3 py-1 text-sm font-semibold ' +
          (activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')
        }>
          {activo ? '● Activo' : '● Inactivo'}
        </span>
        {esYo && <span className="text-sm text-neutral-400">(tu cuenta)</span>}
      </div>

      {!esYo && (
        <div className="mt-4 flex flex-wrap gap-3">
          <form action={alternarActivo}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="activo" value={String(activo)} />
            <button className={
              'rounded-lg px-4 py-2.5 text-base font-semibold text-white ' +
              (activo ? 'bg-amber-600 hover:bg-amber-700' : 'bg-green-600 hover:bg-green-700')
            }>
              {activo ? 'Quitar acceso' : 'Dar acceso'}
            </button>
          </form>

          <form
            action={eliminarUsuario}
            onSubmit={(e) => {
              if (!confirm(`¿Eliminar a "${nombre || email}" de forma permanente? No se puede deshacer.`)) {
                e.preventDefault()
              }
            }}
          >
            <input type="hidden" name="id" value={id} />
            <button className="rounded-lg border-2 border-red-300 px-4 py-2.5 text-base font-semibold text-red-700 hover:bg-red-50">
              Eliminar
            </button>
          </form>
        </div>
      )}
    </div>
  )
}