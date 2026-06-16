'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function cobrarEfectivo(ordenId: string, recibido: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'No autenticado.' }
  const { data: perfil } = await supabase.from('perfiles').select('rol, sede_id').eq('id', user.id).single()
  if (!perfil || !['cajero', 'admin'].includes(perfil.rol)) return { ok: false, error: 'Solo caja puede cobrar.' }

  const { data: orden } = await supabase.from('ordenes').select('id, total, estado, sede_id').eq('id', ordenId).single()
  if (!orden) return { ok: false, error: 'Pedido no encontrado.' }
  if (orden.estado !== 'por_pagar') return { ok: false, error: 'Este pedido ya no está por cobrar.' }

  const total = Number(orden.total)
  if (!(recibido >= total)) return { ok: false, error: 'El monto recibido no cubre el total.' }
  const vuelto = Math.round((recibido - total) * 100) / 100
  const subtotal = Math.round((total / 1.18) * 100) / 100
  const igv = Math.round((total - subtotal) * 100) / 100

  const { data: ult } = await supabase.from('comprobantes')
    .select('correlativo').eq('sede_id', orden.sede_id).eq('tipo', 'ticket')
    .order('correlativo', { ascending: false }).limit(1).maybeSingle()
  const correlativo = (ult?.correlativo ?? 0) + 1

  const { data: comp, error: e1 } = await supabase.from('comprobantes').insert({
    sede_id: orden.sede_id, orden_id: orden.id, cajero_id: user.id,
    tipo: 'ticket', serie: 'B001', correlativo, metodo: 'efectivo',
    subtotal, igv, total, recibido, vuelto,
  }).select('id').single()
  if (e1 || !comp) return { ok: false, error: e1?.message || 'No se pudo registrar el cobro.' }

  const { error: e2 } = await supabase.from('ordenes').update({ estado: 'cobrada' }).eq('id', orden.id)
  if (e2) return { ok: false, error: e2.message }

  revalidatePath('/caja'); revalidatePath('/salon')
  return { ok: true, error: null, comprobanteId: comp.id }
}