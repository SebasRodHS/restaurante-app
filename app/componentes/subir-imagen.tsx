'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// Recorta al centro a un cuadrado y comprime a JPEG (máx 800x800)
async function optimizarCuadrada(file: File): Promise<Blob> {
  const dataUrl = await new Promise<string>((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result as string)
    r.onerror = rej
    r.readAsDataURL(file)
  })
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image()
    i.onload = () => res(i)
    i.onerror = rej
    i.src = dataUrl
  })
  const lado = Math.min(img.width, img.height)          // recorte cuadrado
  const sx = (img.width - lado) / 2
  const sy = (img.height - lado) / 2
  const destino = Math.min(800, lado)                   // máx 800px
  const canvas = document.createElement('canvas')
  canvas.width = destino
  canvas.height = destino
  canvas.getContext('2d')!.drawImage(img, sx, sy, lado, lado, 0, 0, destino, destino)
  return await new Promise<Blob>((res) =>
    canvas.toBlob((b) => res(b!), 'image/jpeg', 0.7)
  )
}

type Props = { productoId: string; imagenActual: string | null }

export default function SubirImagen({ productoId, imagenActual }: Props) {
  const supabase = createClient()
  const [preview, setPreview] = useState<string | null>(imagenActual)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function manejar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSubiendo(true); setError(null)
    try {
      const optimizada = await optimizarCuadrada(file)
      const ruta = `${productoId}.jpg`
      const { error: upErr } = await supabase.storage
        .from('productos')
        .upload(ruta, optimizada, { upsert: true, contentType: 'image/jpeg' })
      if (upErr) throw upErr

      const { data } = supabase.storage.from('productos').getPublicUrl(ruta)
      const url = `${data.publicUrl}?v=${Date.now()}`
      const { error: dbErr } = await supabase
        .from('productos').update({ imagen_url: url }).eq('id', productoId)
      if (dbErr) throw dbErr

      setPreview(url)
    } catch (err: any) {
      setError(err.message || 'No se pudo subir la imagen.')
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <div className="mt-3">
      {preview ? (
        <img src={preview} alt="" className="mb-2 aspect-square w-full rounded-lg object-cover" />
      ) : (
        <div className="mb-2 flex aspect-square w-full items-center justify-center rounded-lg bg-neutral-100 text-sm text-neutral-400">
          Sin imagen
        </div>
      )}
      <label className="inline-block cursor-pointer rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100">
        {subiendo ? 'Subiendo…' : (preview ? 'Cambiar imagen' : 'Subir imagen')}
        <input type="file" accept="image/*" className="hidden" onChange={manejar} disabled={subiendo} />
      </label>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}

