'use client'
import { useEffect, useRef, useState } from 'react'

export default function AvisoSonido({ count }: { count: number }) {
  const [on, setOn] = useState(false)
  const ctxRef = useRef<AudioContext | null>(null)
  const prev = useRef(count)

  function beep() {
    const ctx = ctxRef.current
    if (!ctx) return
    const o = ctx.createOscillator(); const g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
    o.type = 'sine'; o.frequency.value = 880
    g.gain.setValueAtTime(0.001, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    o.start(); o.stop(ctx.currentTime + 0.5)
  }
  function activar() {
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext)
    ctxRef.current = new Ctx(); ctxRef.current.resume(); setOn(true); beep()
  }
  useEffect(() => {
    if (on && count > prev.current) beep()
    prev.current = count
  }, [count, on])

  if (!on) return <button onClick={activar} className="rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-800">🔔 Activar sonido</button>
  return <span className="text-sm font-medium text-emerald-700">🔔 Sonido activado</span>
}