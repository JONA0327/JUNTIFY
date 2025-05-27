import { type NextRequest, NextResponse } from "next/server"
import { createGoogleDriveService } from "@/utils/google-drive"

export async function GET(request: NextRequest) {
  try {
    console.log("Iniciando proceso de autenticación con Google Drive")

    // Obtener el nombre de usuario del encabezado o de los parámetros de consulta
    let username = request.headers.get("X-Username")

    if (!username) {
      // Intentar obtener de los parámetros de consulta
      username = request.nextUrl.searchParams.get("username")
    }

    if (!username) {
      console.error("No se proporcionó nombre de usuario")
      return NextResponse.json(
        { error: "No se proporcionó nombre de usuario", details: "Se requiere el nombre de usuario" },
        { status: 400 },
      )
    }

    console.log("Nombre de usuario recibido:", username)

    // Crear instancia del servicio de Google Drive
    const googleDriveService = createGoogleDriveService()

    // Generar URL de autorización con el estado que incluye el nombre de usuario
    const authUrl = googleDriveService.generateAuthUrl(username)

    console.log("URL de autorización generada:", authUrl)

    // Devolver URL de autorización
    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error("Error al generar URL de autorización:", error)
    return NextResponse.json({ error: "Error al generar URL de autorización", details: String(error) }, { status: 500 })
  }
}
