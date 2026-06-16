import { Shield, Utensils, ChefHat, Wallet, User } from 'lucide-react'

const estilos: Record<string, { color: string; Icono: any; etiqueta: string }> = {
  admin:  { color: 'bg-purple-100 text-purple-700', Icono: Shield,   etiqueta: 'Administrador' },
  mozo:   { color: 'bg-blue-100 text-blue-700',     Icono: Utensils, etiqueta: 'Mozo' },
  cocina: { color: 'bg-orange-100 text-orange-700', Icono: ChefHat,  etiqueta: 'Cocina' },
  cajero: { color: 'bg-green-100 text-green-700',   Icono: Wallet,   etiqueta: 'Cajero' },
}

export default function AvatarRol({ rol }: { rol: string }) {
  const e = estilos[rol] ?? { color: 'bg-neutral-100 text-neutral-600', Icono: User, etiqueta: rol }
  const Icono = e.Icono
  return (
    <div className={'flex h-12 w-12 items-center justify-center rounded-full ' + e.color}>
      <Icono className="h-6 w-6" />
    </div>
  )
}