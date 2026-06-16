'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function crearPedido(payload: {
  mesaId: string; nota: string
  items: { producto_id: string; nombre: string; precio: number; cantidad: number }[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'No autenticado.' }
  const { data: perfil } = await supabase.from('perfiles').select('rol, sede_id').eq('id', user.id).single()
  if (!perfil || !['mozo', 'cajero', 'admin'].includes(perfil.rol)) return { ok: false, error: 'Sin permiso para tomar pedidos.' }
  if (!payload.items.length) return { ok: false, error: 'Agrega al menos un producto.' }

  const totalNuevo = payload.items.reduce((s, it) => s + it.precio * it.cantidad, 0)
  const { data: abierta } = await supabase.from('ordenes')
    .select('id, total, notas').eq('mesa_id', payload.mesaId).eq('estado', 'por_pagar')
    .order('created_at', { ascending: true }).limit(1).maybeSingle()

  let ordenId: string
  if (abierta) {
    ordenId = abierta.id
    const nuevaNota = [abierta.notas, payload.nota].filter(Boolean).join(' · ') || null
    const { error: eU } = await supabase.from('ordenes').update({ total: Number(abierta.total) + totalNuevo, notas: nuevaNota }).eq('id', ordenId)
    if (eU) return { ok: false, error: eU.message }
  } else {
    const { data: orden, error: e1 } = await supabase.from('ordenes').insert({
      sede_id: perfil.sede_id, mesa_id: payload.mesaId, mozo_id: user.id, estado: 'por_pagar', total: totalNuevo, notas: payload.nota || null,
    }).select('id').single()
    if (e1 || !orden) return { ok: false, error: e1?.message || 'No se pudo crear el pedido.' }
    ordenId = orden.id
  }

  const filas = payload.items.map((it) => ({
    orden_id: ordenId, producto_id: it.producto_id, nombre_producto: it.nombre, precio_unitario: it.precio, cantidad: it.cantidad,
  }))
  const { error: e2 } = await supabase.from('orden_items').insert(filas)
  if (e2) {
    if (!abierta) await supabase.from('ordenes').delete().eq('id', ordenId)
    else await supabase.from('ordenes').update({ total: Number(abierta.total) }).eq('id', ordenId)
    return { ok: false, error: e2.message }
  }

  revalidatePath('/pedidos'); revalidatePath('/salon')
  return { ok: true, error: null, ordenId }
}

export async function liberarMesaPedido(mesaId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false }
  await supabase.from('mesas').update({ estado: 'libre', ocupada_desde: null }).eq('id', mesaId)
  revalidatePath('/pedidos'); revalidatePath('/salon')
  return { ok: true }
}

async function staffGuard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, supabase }
  const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', user.id).single()
  return { ok: !!perfil && ['mozo', 'cajero', 'admin'].includes(perfil.rol), supabase }
}

export async function anularItem(formData: FormData) {
  const g = await staffGuard()
  if (!g.ok) return
  const itemId = String(formData.get('item_id') || '')
  const motivo = String(formData.get('motivo') || '').trim() || 'Sin motivo'
  if (!itemId) return

  const { data: item } = await g.supabase.from('orden_items').select('id, orden_id, estado').eq('id', itemId).single()
  if (!item || item.estado === 'anulado') return
  await g.supabase.from('orden_items').update({ estado: 'anulado', motivo_anulacion: motivo }).eq('id', itemId)

  const { data: vivos } = await g.supabase.from('orden_items').select('cantidad, precio_unitario, estado').eq('orden_id', item.orden_id)
  const activos = (vivos ?? []).filter((i) => i.estado !== 'anulado')
  const total = activos.reduce((s, i) => s + Number(i.precio_unitario) * i.cantidad, 0)

  if (activos.length === 0) {
    const { data: orden } = await g.supabase.from('ordenes').select('mesa_id').eq('id', item.orden_id).single()
    await g.supabase.from('ordenes').update({ estado: 'anulada', total: 0, motivo_anulacion: 'Todos los platos anulados' }).eq('id', item.orden_id)
    if (orden?.mesa_id) await g.supabase.from('mesas').update({ estado: 'libre', ocupada_desde: null }).eq('id', orden.mesa_id)
  } else {
    await g.supabase.from('ordenes').update({ total }).eq('id', item.orden_id)
  }
  revalidatePath('/pedidos'); revalidatePath('/caja'); revalidatePath('/cocina')
}

export async function anularPedido(formData: FormData) {
  const g = await staffGuard()
  if (!g.ok) return
  const ordenId = String(formData.get('orden_id') || '')
  const motivo = String(formData.get('motivo') || '').trim() || 'Sin motivo'
  if (!ordenId) return

  const { data: orden } = await g.supabase.from('ordenes').select('id, mesa_id, estado').eq('id', ordenId).single()
  if (!orden || orden.estado === 'cobrada' || orden.estado === 'anulada') return

  await g.supabase.from('orden_items').update({ estado: 'anulado', motivo_anulacion: motivo }).eq('orden_id', ordenId).neq('estado', 'anulado')
  await g.supabase.from('ordenes').update({ estado: 'anulada', total: 0, motivo_anulacion: motivo }).eq('id', ordenId)
  if (orden.mesa_id) await g.supabase.from('mesas').update({ estado: 'libre', ocupada_desde: null }).eq('id', orden.mesa_id)
  revalidatePath('/pedidos'); revalidatePath('/caja'); revalidatePath('/cocina')
}