import { NextResponse } from "next/server"
import { createGoogleDriveService } from "@/utils/google-drive-service"
import { getUsernameFromRequest } from "@/utils/user-helpers"

export async function GET(request: Request) {
  try {
    // Verificar autenticación del usuario
    const username = await getUsernameFromRequest(request)
    if (!username) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
    }

    // Obtener el ID del archivo de la URL
    const url = new URL(request.url)
    const fileId = url.searchParams.get("fileId")

    if (!fileId) {
      return NextResponse.json({ error: "ID de archivo no proporcionado" }, { status: 400 })
    }

    // Crear instancia del servicio de Google Drive
    const googleDriveService = createGoogleDriveService()

    // Obtener el archivo
    const fileData = await googleDriveService.getFile(fileId)

    // Obtener el enlace de descarga
    const downloadLink = await googleDriveService.getDownloadLink(fileId)

    return NextResponse.json({
      success: true,
      fileData,
      downloadLink,
    })
  } catch (error) {
    console.error("Error al obtener archivo de Google Drive:", error)
    return NextResponse.json({ error: "Error al obtener archivo" }, { status: 500 })
  }
}
