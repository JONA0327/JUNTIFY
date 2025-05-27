"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { useDevice } from "@/hooks/use-device"
import { Users } from "lucide-react"

export function NewNavbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()
  const { isMobile } = useDevice()

  // Si estamos en móvil, no renderizamos este componente
  if (isMobile) {
    return null
  }

  // Buscar la sección donde se definen los enlaces de navegación
  // Añadir el enlace a la organización después del enlace a tareas

  // Ejemplo: Si hay un array de enlaces como este:
  // const navLinks = [...]
  // Añadir el nuevo enlace:

  // Añadir después del enlace a "Tareas":
  const navLinks = [
    {
      name: "Organización",
      href: "/organization",
      icon: <Users className="h-5 w-5" />,
    },
  ]

  // El resto del código del navbar...
  // Este componente no se usará ya que tenemos DesktopNavigation
  return null
}
