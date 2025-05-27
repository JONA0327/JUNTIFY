import { type NextRequest, NextResponse } from "next/server"
import { getGoogleDriveClient } from "@/utils/google-drive"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Obtener el ID de la reunión
    const meetingId = params.id
    if (!meetingId) {
      return NextResponse.json({ error: "ID de reunión no proporcionado" }, { status: 400 })
    }

    // Obtener el fileId del query parameter
    const url = new URL(request.url)
    const fileId = url.searchParams.get("fileId")

    if (!fileId) {
      return NextResponse.json({ error: "ID de archivo no proporcionado" }, { status: 400 })
    }

    // Obtener el nombre de usuario del query parameter
    const username = url.searchParams.get("username")
    if (!username) {
      return NextResponse.json({ error: "Usuario no proporcionado" }, { status: 400 })
    }

    console.log(`Obteniendo audio para el archivo ${fileId} del usuario ${username}`)

    try {
      // Obtener el cliente de Google Drive
      const drive = await getGoogleDriveClient(username)
      if (!drive) {
        console.error(`No se pudo obtener el cliente de Google Drive para el usuario ${username}`)
        return NextResponse.json({ error: "No se pudo conectar con Google Drive" }, { status: 500 })
      }

      // Obtener información del archivo
      const fileInfo = await drive.files.get({
        fileId: fileId,
        fields: "name,mimeType,size,webContentLink",
      })

      // Obtener el enlace de descarga directa
      let downloadUrl = fileInfo.data.webContentLink

      if (!downloadUrl) {
        // Si no hay webContentLink, crear un enlace de exportación
        downloadUrl = `https://drive.google.com/uc?id=${fileId}&export=download`
      }

      // Devolver la URL de descarga directa
      return NextResponse.json({
        success: true,
        downloadUrl,
        fileName: fileInfo.data.name,
        mimeType: fileInfo.data.mimeType,
        fileSize: fileInfo.data.size,
      })
    } catch (error) {
      console.error("Error al obtener el archivo de Google Drive:", error)
      return NextResponse.json(
        {
          error: "Error al obtener el archivo de audio",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error al obtener audio:", error)
    return NextResponse.json(
      {
        error: "Error al obtener audio",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
