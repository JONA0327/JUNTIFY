import { type NextRequest, NextResponse } from "next/server"
import { createGoogleDriveService } from "@/utils/google-drive-service"

export async function GET(request: NextRequest, { params }: { params: { fileId: string } }) {
  try {
    const fileId = params.fileId

    if (!fileId) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 })
    }

    console.log(`Streaming audio file with ID: ${fileId}`)

    // Crear una instancia del servicio de Google Drive
    const driveService = createGoogleDriveService()

    // Obtener el token de acceso
    const accessToken = await driveService.getAccessToken()

    // Obtener información del archivo para verificar que existe y obtener su tipo MIME
    const fileInfo = await driveService.getFileInfo(fileId)

    if (!fileInfo) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // URL para descargar el archivo directamente
    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`

    // Hacer la solicitud a Google Drive
    const response = await fetch(downloadUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      console.error(`Error fetching file from Drive: ${response.status} ${response.statusText}`)
      return NextResponse.json({ error: `Error fetching file: ${response.statusText}` }, { status: response.status })
    }

    // Obtener el contenido como ArrayBuffer
    const arrayBuffer = await response.arrayBuffer()

    // Crear una respuesta con los headers adecuados
    const headers = new Headers()
    headers.set("Content-Type", fileInfo.mimeType || "audio/mpeg")
    headers.set("Content-Length", String(arrayBuffer.byteLength))
    headers.set("Access-Control-Allow-Origin", "*")
    headers.set("Access-Control-Allow-Methods", "GET, OPTIONS")
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")
    headers.set("Cache-Control", "public, max-age=3600")

    // Agregar header para forzar la descarga si es necesario
    // headers.set("Content-Disposition", `attachment; filename="${fileInfo.name}"`)

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error("Error streaming audio:", error)
    return NextResponse.json({ error: `Server error: ${error.message}` }, { status: 500 })
  }
}
