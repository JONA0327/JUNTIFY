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

    // Obtener información del archivo de audio
    const infoResponse = await fetch(`${request.nextUrl.origin}/api/meetings/${meetingId}/audio-file`, {
      headers: {
        "X-Username": username,
      },
    })

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

    // Inicializar el servicio de Google Drive
    const driveService = createGoogleDriveService()

    try {
      // Obtener el archivo directamente desde Google Drive
      const fileId = audioInfo.fileId
      console.log(`Descargando archivo con ID: ${fileId}`)

      // Obtener el archivo como un stream
      const drive = await driveService.getDriveClient()
      const response = await drive.files.get(
        {
          fileId: fileId,
          alt: "media",
        },
        { responseType: "arraybuffer" },
      )

      // Verificar que tenemos datos
      if (!response.data) {
        throw new Error("No se recibieron datos del archivo")
      }

      // Convertir a Buffer si es necesario
      const fileData = Buffer.from(response.data)

      // Determinar el tipo MIME
      const mimeType = audioInfo.mimeType || "audio/aac"

      // Devolver el archivo como respuesta
      return new NextResponse(fileData, {
        headers: {
          "Content-Type": mimeType,
          "Content-Disposition": `attachment; filename="${audioInfo.fileName || `audio_${meetingId}.aac`}"`,
          "Content-Length": fileData.length.toString(),
        },
      })
    } catch (driveError) {
      console.error("Error al descargar desde Google Drive:", driveError)
      return NextResponse.json(
        {
          error: "Error al descargar el archivo desde Google Drive",
          details: driveError instanceof Error ? driveError.message : String(driveError),
        },
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
