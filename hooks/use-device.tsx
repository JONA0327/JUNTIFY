"use client"

import { useState, useEffect } from "react"

export function useDevice() {
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth
      setIsMobile(width < 640)
      setIsTablet(width >= 640 && width < 1024)
      setIsDesktop(width >= 1024)
    }

    // Verificar al montar
    checkDevice()

    // Verificar al cambiar el tamaño de la ventana
    window.addEventListener("resize", checkDevice)

    // Limpiar
    return () => window.removeEventListener("resize", checkDevice)
  }, [])

  return { isMobile, isTablet, isDesktop }
}
