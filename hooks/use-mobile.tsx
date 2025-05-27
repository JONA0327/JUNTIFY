"use client"

import { useState, useEffect } from "react"

export function useMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Función para verificar si es un dispositivo móvil
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // Consideramos móvil si es menor a 768px
    }

    // Verificar al cargar
    checkMobile()

    // Agregar listener para cambios de tamaño
    window.addEventListener("resize", checkMobile)

    // Limpiar listener
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  return isMobile
}
