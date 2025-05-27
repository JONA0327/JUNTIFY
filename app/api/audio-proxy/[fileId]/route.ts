import { type NextRequest, NextResponse } from "next/server"
import { createGoogleDriveService } from "@/utils/google-drive-service"

export async function GET(request: NextRequest, { params }: { params: { fileId: string } }) {
  try {
    const fileId = params.fileId

    if (!fileId) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 })
    }

    console.log(`Proxy: Solicitando archivo con ID: ${fileId}`)

    // Crear una instancia del servicio de Google Drive
    const driveService = createGoogleDriveService()

    // Obtener el token de acceso para la solicitud
    const accessToken = await driveService.getAccessToken()

    // Hacer la solicitud directamente a la API de Google Drive
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      console.error(`Error al obtener archivo de Drive: ${response.status} ${response.statusText}`)
      return NextResponse.json(
        { error: `Error al obtener archivo: ${response.statusText}` },
        { status: response.status },
      )
    }

    // Obtener el tipo de contenido
    const contentType = response.headers.get("content-type") || "audio/mpeg"

    // Crear una respuesta con el stream
    const body = await response.arrayBuffer()

    // Crear una respuesta con los headers adecuados
    const newResponse = new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": response.headers.get("content-length") || "",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Cache-Control": "public, max-age=3600",
      },
    })

    return newResponse
  } catch (error) {
    console.error("Error en el proxy de audio:", error)
    return NextResponse.json({ error: `Error interno del servidor: ${error.message}` }, { status: 500 })
  }
}
