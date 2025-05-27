/**
 * Utility functions for user management
 */

// Key for storing username in localStorage
const USERNAME_KEY = "juntify_username"

/**
 * Store username in localStorage
 * @param username The username to store
 */
export function storeUsername(username: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(USERNAME_KEY, username)
    console.log("Username stored in localStorage:", username)
  }
}

/**
 * Get username from localStorage
 * @returns The stored username or null if not found
 */
export function getUsername(): string | null {
  if (typeof window !== "undefined") {
    try {
      const username = localStorage.getItem(USERNAME_KEY)
      console.log("Username retrieved from localStorage:", username)
      return username
    } catch (error) {
      console.error("Error retrieving username from localStorage:", error)
      return null
    }
  }
  return null
}

/**
 * Check if a username is stored
 * @returns True if a username is stored, false otherwise
 */
export function hasUsername(): boolean {
  return getUsername() !== null
}

/**
 * Clear stored username
 */
export function clearUsername(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(USERNAME_KEY)
  }
}

// Add this new function to check if a user is authenticated before making API calls
export function ensureAuthenticated(): boolean {
  const username = getUsername()

  if (!username) {
    console.warn("No username found in localStorage")
    return false
  }

  return true
}

// Update the addUsernameToHeaders function to be more robust
export function addUsernameToHeaders(headers: HeadersInit = {}): HeadersInit {
  const username = getUsername()

  // Create a new Headers object to ensure we can modify it
  const newHeaders = new Headers(headers)

  if (username) {
    newHeaders.append("X-Username", username)
    return newHeaders
  } else {
    console.warn("No username available for request headers")
    return headers
  }
}

export async function getUsernameFromCookie(): Promise<string | null> {
  return getUsername()
}

import type { NextRequest } from "next/server"

export async function getUsernameFromRequest(request: NextRequest): Promise<string | null> {
  // Primero intentamos obtener el username del encabezado X-Username
  const username = request.headers.get("X-Username")
  if (username) {
    console.log("Username obtenido del encabezado X-Username:", username)
    return username
  }

  // Si no hay encabezado X-Username, intentamos obtenerlo de los parámetros de consulta
  const usernameParam = request.nextUrl.searchParams.get("username")
  if (usernameParam) {
    console.log("Username obtenido de los parámetros de consulta:", usernameParam)
    return usernameParam
  }

  // Si no hay username en los encabezados ni en los parámetros, intentamos obtenerlo de las cookies
  const cookies = request.cookies
  const usernameCookie = cookies.get("username")
  if (usernameCookie) {
    console.log("Username obtenido de las cookies:", usernameCookie.value)
    return usernameCookie.value
  }

  console.log("No se pudo obtener el username de la solicitud")
  return null
}
