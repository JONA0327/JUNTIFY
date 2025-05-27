/**
 * Utilidad para depuración de rutas y redirecciones
 */

// Función para registrar información de navegación
export function logNavigation(message: string, data?: any) {
  console.log(`[NAVEGACIÓN] ${message}`, data || "")
}

// Función para registrar información de autenticación
export function logAuth(message: string, data?: any) {
  console.log(`[AUTENTICACIÓN] ${message}`, data || "")
}

// Función para registrar información de redirección
export function logRedirect(message: string, data?: any) {
  console.warn(`[REDIRECCIÓN] ${message}`, data || "")
}

// Función para registrar errores
export function logError(message: string, error?: any) {
  console.error(`[ERROR] ${message}`, error || "")
}

// Función para verificar si estamos en una página específica
export function checkCurrentPage() {
  if (typeof window !== "undefined") {
    const path = window.location.pathname
    console.log(`[PÁGINA ACTUAL] ${path}`)
    return path
  }
  return null
}

// Función para monitorear cambios de URL
export function monitorUrlChanges() {
  if (typeof window !== "undefined") {
    // Registrar la URL inicial
    logNavigation("URL inicial", window.location.href)

    // Monitorear cambios de historia
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState

    history.pushState = function () {
      logNavigation("pushState llamado con", arguments)
      return originalPushState.apply(this, arguments as any)
    }

    history.replaceState = function () {
      logNavigation("replaceState llamado con", arguments)
      return originalReplaceState.apply(this, arguments as any)
    }

    // Monitorear eventos de popstate
    window.addEventListener("popstate", () => {
      logNavigation("popstate evento - nueva URL", window.location.href)
    })
  }
}

// Función para verificar el estado de la autenticación
export async function checkAuthState() {
  try {
    // Verificar localStorage
    const username = localStorage.getItem("juntify_username")
    logAuth("Username en localStorage", username || "NO ENCONTRADO")

    // Verificar sessionStorage
    const sessionData = sessionStorage.getItem("supabase.auth.token")
    logAuth("Token en sessionStorage", sessionData ? "PRESENTE" : "NO ENCONTRADO")

    return {
      hasUsername: !!username,
      hasSession: !!sessionData,
    }
  } catch (error) {
    logError("Error al verificar estado de autenticación", error)
    return {
      hasUsername: false,
      hasSession: false,
      error,
    }
  }
}
