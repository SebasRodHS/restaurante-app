'use server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function exigirAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, sede_id: null, miId: null }
  const { data: perfil } = await supabase
    .from('perfiles').select('rol, sede_id').eq('id', user.id).single()
  return { ok: perfil?.rol === 'admin', sede_id: perfil?.sede_id ?? null, miId: user.id }
}

export async function crearUsuario(_prev: any, formData: FormData) {
  const guard = await exigirAdmin()
  if (!guard.ok) return { ok: false, error: 'Solo el admin puede crear usuarios.' }

  const nombre = String(formData.get('nombre') || '').trim()
  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')
  const rol = String(formData.get('rol') || 'mozo')

  if (!email || password.length < 6)
    return { ok: false, error: 'Ingresa un correo válido y una contraseña de al menos 6 caracteres.' }

  const admin = createAdminClient()
  const { data: creado, error: e1 } = await admin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { nombre },
  })
  if (e1) return { ok: false, error: e1.message }

  const { error: e2 } = await admin.from('perfiles')
    .update({ nombre, rol, sede_id: guard.sede_id })
    .eq('id', creado.user!.id)
  if (e2) return { ok: false, error: e2.message }

  revalidatePath('/usuarios')
  return { ok: true, error: null }
}

export async function alternarActivo(formData: FormData) {
  const guard = await exigirAdmin()
  if (!guard.ok) return
  const id = String(formData.get('id') || '')
  const activo = String(formData.get('activo') || '') === 'true'
  if (id === guard.miId) return // no permitir desactivarse a sí mismo
  const admin = createAdminClient()
  await admin.from('perfiles').update({ activo: !activo }).eq('id', id)
  revalidatePath('/usuarios')
}

export async function eliminarUsuario(formData: FormData) {
  const guard = await exigirAdmin()
  if (!guard.ok) return
  const id = String(formData.get('id') || '')
  if (id === guard.miId) return // no permitir eliminarse a sí mismo
  const admin = createAdminClient()
  // Borra el usuario de Auth; el perfil se elimina solo por la relación en cascada
  await admin.auth.admin.deleteUser(id)
  revalidatePath('/usuarios')
}