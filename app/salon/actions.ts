'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function adminGuard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, supabase, sede_id: null }
  const { data: perfil } = await supabase.from('perfiles').select('rol, sede_id').eq('id', user.id).single()
  return { ok: perfil?.rol === 'admin', supabase, sede_id: perfil?.sede_id ?? null }
}

export async function crearZona(formData: FormData) {
  const g = await adminGuard()
  if (!g.ok) return
  const nombre = String(formData.get('nombre') || '').trim()
  if (!nombre) return
  const { data: ult } = await g.supabase.from('zonas').select('orden').order('orden', { ascending: false }).limit(1).maybeSingle()
  const orden = (ult?.orden ?? 0) + 1
  await g.supabase.from('zonas').insert({ nombre, orden, sede_id: g.sede_id })
  revalidatePath('/salon')
}

export async function crearMesa(formData: FormData) {
  const g = await adminGuard()
  if (!g.ok) return
  const zona_id = String(formData.get('zona_id') || '') || null
  if (!zona_id) return
  const { data: existentes } = await g.supabase.from('mesas').select('numero')
  const usados = new Set((existentes ?? []).map((m) => Number(m.numero)).filter((n) => !Number.isNaN(n)))
  let n = 1
  while (usados.has(n)) n++
  const { count } = await g.supabase.from('mesas').select('id', { count: 'exact', head: true }).eq('zona_id', zona_id)
  const idx = count ?? 0
  await g.supabase.from('mesas').insert({
    numero: String(n), zona_id, piso: 1, pos_x: idx % 5, pos_y: Math.floor(idx / 5), sede_id: g.sede_id,
  })
  revalidatePath('/salon')
}

export async function asignarMesa(formData: FormData) {
  const g = await adminGuard()
  if (!g.ok) return
  const id = String(formData.get('id') || '')
  const zona_id = String(formData.get('zona_id') || '') || null
  const mozo_asignado_id = String(formData.get('mozo_asignado_id') || '') || null
  if (!id) return
  await g.supabase.from('mesas').update({ zona_id, mozo_asignado_id }).eq('id', id)
  revalidatePath('/salon')
}

export async function cambiarEstadoMesa(formData: FormData) {
  const g = await adminGuard()
  if (!g.ok) return
  const id = String(formData.get('id') || '')
  const estado = String(formData.get('estado') || '')
  if (!id || !['libre', 'reservada', 'ocupada', 'pagada'].includes(estado)) return
  await g.supabase.from('mesas').update({ estado }).eq('id', id)
  revalidatePath('/salon')
}

export async function eliminarMesa(formData: FormData) {
  const g = await adminGuard()
  if (!g.ok) return
  const id = String(formData.get('id') || '')
  await g.supabase.from('mesas').delete().eq('id', id)
  revalidatePath('/salon')
}

// Liberar mesa: lo puede hacer cualquier usuario del personal (no solo admin)
export async function liberarMesa(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const id = String(formData.get('id') || '')
  if (!id) return
  await supabase.from('mesas').update({ estado: 'libre', ocupada_desde: null }).eq('id', id)
  revalidatePath('/salon')
}