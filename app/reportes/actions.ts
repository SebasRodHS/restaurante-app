'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function adminGuard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, supabase, sede_id: null, uid: null }
  const { data: perfil } = await supabase.from('perfiles').select('rol, sede_id').eq('id', user.id).single()
  return { ok: perfil?.rol === 'admin', supabase, sede_id: perfil?.sede_id ?? null, uid: user.id }
}

export async function registrarGasto(formData: FormData) {
  const g = await adminGuard()
  if (!g.ok) return
  const concepto = String(formData.get('concepto') || '').trim()
  const monto = Number(formData.get('monto') || 0)
  const fecha = String(formData.get('fecha') || '') || undefined
  if (!concepto || !(monto > 0)) return
  await g.supabase.from('gastos').insert({ sede_id: g.sede_id, registrado_por: g.uid, concepto, monto, ...(fecha ? { fecha } : {}) })
  revalidatePath('/reportes')
}

export async function eliminarGasto(formData: FormData) {
  const g = await adminGuard()
  if (!g.ok) return
  const id = String(formData.get('id') || '')
  if (!id) return
  await g.supabase.from('gastos').delete().eq('id', id)
  revalidatePath('/reportes')
}