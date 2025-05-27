import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Iniciar Sesión - Juntify",
  description: "Accede a tu cuenta de Juntify para gestionar tus reuniones inteligentes",
}

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}
