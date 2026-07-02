import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from './logout-button'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: perfil } = await supabase.from('perfiles').select('nombre, rol').eq('id', user.id).single()
  const rol = perfil?.rol ?? ''

  let avisos = 0
  if (rol === 'mozo' || rol === 'admin') {
    const { count } = await supabase.from('notificaciones').select('id', { count: 'exact', head: true }).eq('leida', false)
    avisos = count ?? 0
  }

  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-900">Panel</h1>
          <LogoutButton />
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <p className="text-neutral-700">Hola, <span className="font-medium">{perfil?.nombre || user.email}</span></p>
          <p className="mt-1 text-sm text-neutral-500">Rol: <span className="font-semibold uppercase">{rol || '—'}</span></p>
        </div>
        <div className="mt-4 grid gap-3">
          {(rol === 'mozo' || rol === 'cajero' || rol === 'admin') && (
            <Link href="/pedidos" className="rounded-lg bg-emerald-700 px-4 py-3 text-center text-sm font-medium text-white hover:bg-emerald-800">Tomar pedido</Link>
          )}
          {(rol === 'mozo' || rol === 'admin') && (
            <Link href="/avisos" className="rounded-lg bg-emerald-600 px-4 py-3 text-center text-sm font-medium text-white hover:bg-emerald-700">
              Avisos{avisos > 0 ? ` (${avisos})` : ''}
            </Link>
          )}
          {(rol === 'cocina' || rol === 'admin') && (
            <Link href="/cocina" className="rounded-lg bg-orange-700 px-4 py-3 text-center text-sm font-medium text-white hover:bg-orange-800">Cocina</Link>
          )}
          {(rol === 'cajero' || rol === 'admin') && (
            <Link href="/caja" className="rounded-lg bg-green-700 px-4 py-3 text-center text-sm font-medium text-white hover:bg-green-800">Caja</Link>
          )}
          {rol === 'admin' && (
            <>
              <Link href="/salon" className="rounded-lg bg-neutral-800 px-4 py-3 text-center text-sm font-medium text-white hover:bg-neutral-700">Ver salón</Link>
              <Link href="/usuarios" className="rounded-lg bg-neutral-900 px-4 py-3 text-center text-sm font-medium text-white hover:bg-neutral-800">Gestionar usuarios</Link>
              <Link href="/carta" className="rounded-lg bg-amber-700 px-4 py-3 text-center text-sm font-medium text-white hover:bg-amber-800">Gestionar carta y stock</Link>
              <Link href="/reportes" className="rounded-lg bg-indigo-700 px-4 py-3 text-center text-sm font-medium text-white hover:bg-indigo-800">Reportes</Link>
              <Link href="/cierres" className="rounded-lg bg-slate-700 px-4 py-3 text-center text-sm font-medium text-white hover:bg-slate-800">Cierres de caja</Link>
            </>
          )}
        </div>
      </div>
    </main>
  )
}