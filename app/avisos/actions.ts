'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function marcarEntregado(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const itemId = String(formData.get('item_id') || '')
  const notifId = String(formData.get('notif_id') || '')
  if (itemId) await supabase.from('orden_items').update({ estado: 'entregado' }).eq('id', itemId)
  if (notifId) await supabase.from('notificaciones').update({ leida: true }).eq('id', notifId)
  revalidatePath('/avisos'); revalidatePath('/cocina')
}