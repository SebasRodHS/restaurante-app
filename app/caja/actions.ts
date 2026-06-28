'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function cajaGuard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, supabase, sede_id: null, uid: null }
  const { data: perfil } = await supabase.from('perfiles').select('rol, sede_id').eq('id', user.id).single()
  return { ok: !!perfil && ['cajero', 'admin'].includes(perfil.rol), supabase, sede_id: perfil?.sede_id ?? null, uid: user.id }
}

export async function abrirCaja(formData: FormData) {
  const g = await cajaGuard()
  if (!g.ok) return
  const monto = Number(formData.get('monto_inicial') || 0)
  const { data: ya } = await g.supabase.from('sesiones_caja').select('id').eq('sede_id', g.sede_id).eq('estado', 'abierta').maybeSingle()
  if (ya) return
  await g.supabase.from('sesiones_caja').insert({ sede_id: g.sede_id, abierta_por: g.uid, monto_inicial: monto >= 0 ? monto : 0, estado: 'abierta' })
  revalidatePath('/caja')
}

export async function cerrarCaja(formData: FormData) {
  const g = await cajaGuard()
  if (!g.ok) return { ok: false }
  const contado = Number(formData.get('monto_contado') || 0)
  const notas = String(formData.get('notas') || '').trim() || null
  const { data: ses } = await g.supabase.from('sesiones_caja').select('id').eq('sede_id', g.sede_id).eq('estado', 'abierta').order('abierta_en', { ascending: false }).limit(1).maybeSingle()
  if (!ses) return { ok: false }
  await g.supabase.from('sesiones_caja').update({ estado: 'cerrada', monto_contado: contado, notas, cerrada_en: new Date().toISOString(), cerrada_por: g.uid }).eq('id', ses.id)
  revalidatePath('/caja')
  return { ok: true, sesionId: ses.id }
}

export async function cobrarEfectivo(ordenId: string, recibido: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'No autenticado.' }
  const { data: perfil } = await supabase.from('perfiles').select('rol, sede_id').eq('id', user.id).single()
  if (!perfil || !['cajero', 'admin'].includes(perfil.rol)) return { ok: false, error: 'Solo caja puede cobrar.' }

  const { data: orden } = await supabase.from('ordenes').select('id, total, estado, sede_id').eq('id', ordenId).single()
  if (!orden) return { ok: false, error: 'Pedido no encontrado.' }
  if (orden.estado !== 'por_pagar') return { ok: false, error: 'Este pedido ya no está por cobrar.' }

  const { data: ses } = await supabase.from('sesiones_caja').select('id').eq('sede_id', orden.sede_id).eq('estado', 'abierta').order('abierta_en', { ascending: false }).limit(1).maybeSingle()
  if (!ses) return { ok: false, error: 'Primero abre la caja (fondo inicial) para registrar cobros.' }

  const total = Number(orden.total)
  if (!(recibido >= total)) return { ok: false, error: 'El monto recibido no cubre el total.' }
  const vuelto = Math.round((recibido - total) * 100) / 100
  const subtotal = Math.round((total / 1.18) * 100) / 100
  const igv = Math.round((total - subtotal) * 100) / 100

  const { data: ult } = await supabase.from('comprobantes').select('correlativo').eq('sede_id', orden.sede_id).eq('tipo', 'ticket').order('correlativo', { ascending: false }).limit(1).maybeSingle()
  const correlativo = (ult?.correlativo ?? 0) + 1

  const { data: comp, error: e1 } = await supabase.from('comprobantes').insert({
    sede_id: orden.sede_id, orden_id: orden.id, cajero_id: user.id, sesion_id: ses.id,
    tipo: 'ticket', serie: 'B001', correlativo, metodo: 'efectivo', subtotal, igv, total, recibido, vuelto,
  }).select('id').single()
  if (e1 || !comp) return { ok: false, error: e1?.message || 'No se pudo registrar el cobro.' }

  const { error: e2 } = await supabase.from('ordenes').update({ estado: 'cobrada' }).eq('id', orden.id)
  if (e2) return { ok: false, error: e2.message }

  revalidatePath('/caja'); revalidatePath('/salon')
  return { ok: true, error: null, comprobanteId: comp.id }
}