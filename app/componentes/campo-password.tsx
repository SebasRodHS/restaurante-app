'use client'
import { useState } from 'react'

type Props = {
  name?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  onEnter?: () => void
}

export default function CampoPassword({
  name, value, onChange, placeholder = 'Contraseña', onEnter,
}: Props) {
  const [ver, setVer] = useState(false)
  return (
    <div className="relative">
      <input
        name={name}
        type={ver ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onKeyDown={(e) => { if (e.key === 'Enter' && onEnter) onEnter() }}
        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 pr-16 text-neutral-900 placeholder-neutral-400 focus:border-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-800"
      />
      <button
        type="button"
        onClick={() => setVer((v) => !v)}
        className="absolute inset-y-0 right-0 px-3 text-sm font-medium text-neutral-500 hover:text-neutral-800"
        aria-label={ver ? 'Ocultar contraseña' : 'Ver contraseña'}
      >
        {ver ? 'Ocultar' : 'Ver'}
      </button>
    </div>
  )
}