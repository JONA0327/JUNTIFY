"use client"

import { useState, useEffect } from "react"

export function useVirtualKeyboard() {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)

  useEffect(() => {
    // Altura inicial de la ventana
    let initialWindowHeight = window.innerHeight

    const handleResize = () => {
      // En dispositivos móviles, cuando el teclado aparece, la altura de la ventana disminuye
      // Si la altura actual es significativamente menor que la altura inicial, asumimos que el teclado está visible
      const keyboardThreshold = 150 // Umbral para determinar si el teclado está visible
      const currentWindowHeight = window.innerHeight

      if (initialWindowHeight - currentWindowHeight > keyboardThreshold) {
        setIsKeyboardVisible(true)
      } else {
        setIsKeyboardVisible(false)
      }
    }

    // Detectar cambios de orientación que podrían resetear la altura de referencia
    const handleOrientationChange = () => {
      // Esperar a que se complete el cambio de orientación
      setTimeout(() => {
        initialWindowHeight = window.innerHeight
        handleResize()
      }, 300)
    }

    // También podemos detectar cuando un elemento de entrada recibe o pierde el foco
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        // Pequeño retraso para dar tiempo a que aparezca el teclado
        setTimeout(() => handleResize(), 100)
      }
    }

    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        // Pequeño retraso para dar tiempo a que desaparezca el teclado
        setTimeout(() => handleResize(), 100)
      }
    }

    window.addEventListener("resize", handleResize)
    window.addEventListener("orientationchange", handleOrientationChange)
    document.addEventListener("focusin", handleFocusIn)
    document.addEventListener("focusout", handleFocusOut)

    // Inicializar
    initialWindowHeight = window.innerHeight

    return () => {
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("orientationchange", handleOrientationChange)
      document.removeEventListener("focusin", handleFocusIn)
      document.removeEventListener("focusout", handleFocusOut)
    }
  }, [])

  return { isKeyboardVisible }
}
