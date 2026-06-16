'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function adminGuard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, supabase, sede_id: null }
  const { data: perfil } = await supabase
    .from('perfiles').select('rol, sede_id').eq('id', user.id).single()
  return { ok: perfil?.rol === 'admin', supabase, sede_id: perfil?.sede_id ?? null }
}

export async function crearCategoria(formData: FormData) {
  const g = await adminGuard()
  if (!g.ok) return
  const nombre = String(formData.get('nombre') || '').trim()
  if (!nombre) return
  await g.supabase.from('categorias').insert({ nombre, sede_id: g.sede_id })
  revalidatePath('/carta')
}

export async function crearProducto(_prev: any, formData: FormData) {
  const g = await adminGuard()
  if (!g.ok) return { ok: false, error: 'Solo el admin.' }
  const nombre = String(formData.get('nombre') || '').trim()
  const tipo = String(formData.get('tipo') || 'plato')
  const categoria_id = String(formData.get('categoria_id') || '') || null
  const precio = Number(formData.get('precio') || 0)
  const descripcion = String(formData.get('descripcion') || '').trim() || null
  const controla_stock = String(formData.get('controla_stock') || '') === 'on'
  if (!nombre || isNaN(precio) || precio < 0)
    return { ok: false, error: 'Completa el nombre y un precio válido.' }
  const { error } = await g.supabase.from('productos').insert({
    nombre, tipo, categoria_id, precio, descripcion, controla_stock, sede_id: g.sede_id,
  })
  if (error) return { ok: false, error: error.message }
  revalidatePath('/carta')
  return { ok: true, error: null }
}

export async function editarProducto(formData: FormData) {
  const g = await adminGuard()
  if (!g.ok) return
  const id = String(formData.get('id') || '')
  const nombre = String(formData.get('nombre') || '').trim()
  const precio = Number(formData.get('precio') || 0)
  const categoria_id = String(formData.get('categoria_id') || '') || null
  if (!id || !nombre || isNaN(precio) || precio < 0) return
  await g.supabase.from('productos').update({ nombre, precio, categoria_id }).eq('id', id)
  revalidatePath('/carta')
}

export async function alternarDisponible(formData: FormData) {
  const g = await adminGuard()
  if (!g.ok) return
  const id = String(formData.get('id') || '')
  const disponible = String(formData.get('disponible') || '') === 'true'
  await g.supabase.from('productos').update({ disponible: !disponible }).eq('id', id)
  revalidatePath('/carta')
}

export async function eliminarProducto(formData: FormData) {
  const g = await adminGuard()
  if (!g.ok) return
  const id = String(formData.get('id') || '')
  await g.supabase.from('productos').delete().eq('id', id)
  revalidatePath('/carta')
}

export async function fijarStockHoy(formData: FormData) {
  const g = await adminGuard()
  if (!g.ok) return
  const producto_id = String(formData.get('producto_id') || '')
  const cantidad = Number(formData.get('cantidad') || 0)
  if (!producto_id || isNaN(cantidad) || cantidad < 0) return
  const hoy = new Date().toISOString().slice(0, 10)
  await g.supabase.from('stock_diario').upsert(
    { producto_id, sede_id: g.sede_id, fecha: hoy, cantidad_inicial: cantidad, cantidad_actual: cantidad },
    { onConflict: 'producto_id,fecha' }
  )
  revalidatePath('/carta')
}