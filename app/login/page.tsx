'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import CampoPassword from '@/app/componentes/campo-password'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  async function ingresar() {
    if (cargando) return
    setCargando(true); setError(null)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setCargando(false); setError(error.message); return }

    const { data: perfil } = await supabase
      .from('perfiles').select('activo').eq('id', data.user.id).single()
    if (perfil && perfil.activo === false) {
      await supabase.auth.signOut()
      setCargando(false)
      setError('Tu cuenta está desactivada. Contacta al administrador.')
      return
    }

    setCargando(false)
    router.push('/'); router.refresh()
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        {/* Logo / imagen: coloca tu archivo en la carpeta public/ con el nombre logo.png */}
        <div className="mb-5 flex justify-center">
          <img
            src="/logo.png"
            alt="Cuyería Mirador Cusqueñitas"
            className="h-24 w-24 rounded-full object-cover ring-2 ring-amber-200"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
        </div>

        <h1 className="text-center text-2xl font-extrabold tracking-tight text-amber-900">
          Cuyería Mirador
        </h1>
        <p className="mb-6 text-center text-lg font-semibold text-amber-700">
          Cusqueñitas
        </p>

        <input
          className="mb-3 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') ingresar() }}
        />

        <div className="mb-4">
          <CampoPassword
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onEnter={ingresar}
          />
        </div>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <button
          onClick={ingresar}
          disabled={cargando}
          className="w-full rounded-lg bg-amber-700 px-3 py-2.5 font-semibold text-white hover:bg-amber-800 disabled:opacity-50"
        >
          {cargando ? 'Ingresando…' : 'Ingresar'}
        </button>
      </div>
    </main>
  )
}