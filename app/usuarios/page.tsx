import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import NuevoUsuario from './nuevo-usuario'
import TarjetaUsuario from './tarjeta-usuario'

export default async function UsuariosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: yo } = await supabase.from('perfiles').select('rol').eq('id', user.id).single()
  if (yo?.rol !== 'admin') redirect('/')

  const admin = createAdminClient()
  const { data: perfiles } = await admin
    .from('perfiles').select('id, nombre, rol, activo').order('created_at', { ascending: true })
  const { data: lista } = await admin.auth.admin.listUsers()
  const emailPorId = new Map((lista?.users ?? []).map((u) => [u.id, u.email]))

  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-900">Usuarios</h1>
          <Link href="/" className="text-sm text-neutral-600 hover:underline">← Volver al panel</Link>
        </div>

        <NuevoUsuario />

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {perfiles?.map((p) => (
            <TarjetaUsuario
              key={p.id}
              id={p.id}
              nombre={p.nombre}
              email={emailPorId.get(p.id) ?? ''}
              rol={p.rol}
              activo={p.activo}
              esYo={p.id === user.id}
            />
          ))}
        </div>

        <p className="mt-6 text-sm text-neutral-500">
          <span className="font-medium">Quitar acceso</span>: la persona ya no podrá ingresar, pero puedes
          devolvérselo cuando quieras. <span className="font-medium">Eliminar</span>: borra la cuenta para siempre.
        </p>
      </div>
    </main>
  )
}