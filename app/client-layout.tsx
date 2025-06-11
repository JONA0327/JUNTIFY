"use client"

import type React from "react"

import { useDevice } from "@/hooks/use-device"
import { useVirtualKeyboard } from "@/hooks/use-virtual-keyboard"
import { DesktopNavigation } from "@/components/desktop-navigation"
import { MobileNavigation } from "@/components/mobile-navigation"
import "./globals.css"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isMobile, isDesktop } = useDevice()
  const { isKeyboardVisible } = useVirtualKeyboard()

  return (
    <>
      {/* Navegación según dispositivo */}
      {isDesktop && <DesktopNavigation />}

      {/* Contenido principal con padding adecuado */}
      <div className={`flex flex-col min-h-screen ${isDesktop ? "pt-16" : ""}`}>
        <main className="flex-grow">{children}</main>

        {/* Espacio adicional en móvil para evitar empalme con el footer, solo cuando el teclado no está visible */}
        {isMobile && !isKeyboardVisible && <div className="h-20"></div>}
      </div>

      {/* Navegación móvil */}
      {isMobile && <MobileNavigation />}
    </>
  )
}
