'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()
  async function salir() {
    await supabase.auth.signOut()
    router.push('/login'); router.refresh()
  }
  return (
    <button onClick={salir}
      className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100">
      Salir
    </button>
  )
}