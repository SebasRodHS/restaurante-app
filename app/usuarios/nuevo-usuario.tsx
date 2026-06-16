'use client'
import { useActionState } from 'react'
import { crearUsuario } from './actions'
import CampoPassword from '@/app/componentes/campo-password'

const inicial = { ok: false, error: null as string | null }

export default function NuevoUsuario() {
  const [estado, action, pendiente] = useActionState(crearUsuario, inicial)
  const input = "rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:border-neutral-800 focus:outline-none"
  return (
    <form action={action} className="rounded-lg bg-white p-4 shadow-sm">
      <h2 className="mb-3 font-semibold text-neutral-800">Nuevo usuario</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="nombre" placeholder="Nombre" className={input} />
        <select name="rol" className={input}>
          <option value="mozo">Mozo</option>
          <option value="cocina">Cocina</option>
          <option value="cajero">Cajero</option>
          <option value="admin">Admin</option>
        </select>
        <input name="email" type="email" placeholder="Correo" className={input} />
        <CampoPassword name="password" placeholder="Contraseña (mín. 6)" />
      </div>
      {estado.error && <p className="mt-3 text-sm text-red-600">{estado.error}</p>}
      {estado.ok && <p className="mt-3 text-sm text-green-700">Usuario creado correctamente.</p>}
      <button disabled={pendiente}
        className="mt-4 rounded-lg bg-neutral-900 px-4 py-2 font-medium text-white hover:bg-neutral-800 disabled:opacity-50">
        {pendiente ? 'Creando…' : 'Crear usuario'}
      </button>
    </form>
  )
}