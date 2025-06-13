import { type NextRequest, NextResponse } from "next/server"
import { createGoogleDriveService } from "@/utils/google-drive-service"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Obtener el ID de la reunión
    const meetingId = params.id
    if (!meetingId) {
      return NextResponse.json({ error: "ID de reunión no proporcionado" }, { status: 400 })
    }

    // Obtener el nombre de usuario del encabezado
    const username = request.headers.get("X-Username")
    if (!username) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
    }

    console.log(`Descargando audio para la reunión ${meetingId} del usuario ${username}`)

    // Obtener el token de autenticación de las cookies
    const token = request.cookies.get("auth_token")?.value

    // Obtener información del archivo de audio
    const infoResponse = await fetch(
      `${request.nextUrl.origin}/api/meetings/${meetingId}/audio-file`,
      {
        headers: {
          "X-Username": username,
          ...(token ? { Cookie: `auth_token=${token}` } : {}),
        },
      },
    )

    if (!infoResponse.ok) {
      const errorData = await infoResponse.json()
      return NextResponse.json(
        { error: errorData.error || "No se pudo obtener información del archivo" },
        { status: 404 },
      )
    }

    const audioInfo = await infoResponse.json()
    if (!audioInfo.success || !audioInfo.fileId) {
      return NextResponse.json({ error: "No se encontró el archivo de audio" }, { status: 404 })
    }

    // Crear una instancia del servicio de Google Drive
    const driveService = createGoogleDriveService()
    if (!driveService) {
      return NextResponse.json({ error: "No se pudo crear el servicio de Google Drive" }, { status: 500 })
    }

    // Descargar el archivo
    try {
      // Obtener el archivo directamente de Google Drive
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${audioInfo.fileId}?alt=media`, {
        headers: {
          Authorization: `Bearer ${await driveService.getAccessToken()}`,
        },
      })

      if (!response.ok) {
        return NextResponse.json({ error: "No se pudo descargar el archivo de Google Drive" }, { status: 500 })
      }

      // Obtener el contenido del archivo
      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Crear una respuesta con el contenido del archivo
      const nextResponse = new NextResponse(buffer)
      nextResponse.headers.set("Content-Type", audioInfo.mimeType || "audio/aac")
      nextResponse.headers.set("Content-Disposition", `inline; filename="${audioInfo.fileName}"`)
      return nextResponse
    } catch (error) {
      console.error("Error al descargar archivo de Google Drive:", error)
      return NextResponse.json(
        { error: "Error al descargar archivo de Google Drive", details: String(error) },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error al descargar archivo de audio:", error)
    return NextResponse.json(
      {
        error: "Error al descargar archivo de audio",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
