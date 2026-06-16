'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function marcarListo(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data: perfil } = await supabase.from('perfiles').select('rol, sede_id').eq('id', user.id).single()
  if (!perfil || !['cocina', 'admin'].includes(perfil.rol)) return
  const itemId = String(formData.get('item_id') || '')
  if (!itemId) return

  const { data: item } = await supabase.from('orden_items').select('id, orden_id, nombre_producto, cantidad').eq('id', itemId).single()
  if (!item) return
  await supabase.from('orden_items').update({ estado: 'listo' }).eq('id', itemId)

  const { data: orden } = await supabase.from('ordenes').select('mesa_id, mozo_id, sede_id').eq('id', item.orden_id).single()
  let mesaNum = '—'
  if (orden?.mesa_id) {
    const { data: m } = await supabase.from('mesas').select('numero').eq('id', orden.mesa_id).single()
    mesaNum = m?.numero ?? '—'
  }

  await supabase.from('notificaciones').insert({
    sede_id: orden?.sede_id ?? perfil.sede_id,
    destinatario_id: orden?.mozo_id ?? null,
    orden_id: item.orden_id,
    orden_item_id: item.id,
    tipo: 'plato_listo',
    mensaje: `Mesa ${mesaNum}: ${item.cantidad} × ${item.nombre_producto} listo para servir.`,
  })

  revalidatePath('/cocina'); revalidatePath('/avisos')
}