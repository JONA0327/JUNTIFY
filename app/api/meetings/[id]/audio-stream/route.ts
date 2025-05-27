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

    // Obtener el nombre de usuario del encabezado o de la cookie
    let username = request.headers.get("X-Username")

    // Si no hay username en el header, intentar obtenerlo de las cookies
    if (!username) {
      const cookies = request.cookies
      username = cookies.get("username")?.value
    }

    // Si aún no hay username, intentar obtenerlo de localStorage (esto no funcionará en el servidor)
    // Pero podemos pasar el username como query parameter
    if (!username) {
      username = url.searchParams.get("username")
    }

    if (!username) {
      console.error("No se pudo obtener el nombre de usuario para la autenticación")
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
    }

    console.log(`Transmitiendo audio para el archivo ${fileId} del usuario ${username}`)

    // Obtener el cliente de Google Drive
    const drive = await getGoogleDriveClient(username)
    if (!drive) {
      console.error(`No se pudo obtener el cliente de Google Drive para el usuario ${username}`)
      return NextResponse.json({ error: "No se pudo conectar con Google Drive" }, { status: 500 })
    }

    try {
      // Obtener el archivo directamente como un stream
      const response = await drive.files.get(
        {
          fileId: fileId,
          alt: "media",
        },
        { responseType: "arraybuffer" },
      )

      // Obtener información del archivo para los headers
      const fileInfo = await drive.files.get({
        fileId: fileId,
        fields: "name,mimeType,size",
      })

      const fileName = fileInfo.data.name || "audio.aac"
      const mimeType = fileInfo.data.mimeType || "audio/aac"
      const size = fileInfo.data.size || "0"

      // Crear headers para la respuesta
      const headers = new Headers()
      headers.set("Content-Type", mimeType)
      headers.set("Content-Disposition", `inline; filename="${fileName}"`)
      if (size) headers.set("Content-Length", size)
      headers.set("Accept-Ranges", "bytes")
      headers.set("Cache-Control", "public, max-age=3600")
      headers.set("Access-Control-Allow-Origin", "*")

      // Devolver la respuesta con los datos
      return new NextResponse(response.data, {
        headers,
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
    console.error("Error al transmitir audio:", error)
    return NextResponse.json(
      {
        error: "Error al transmitir audio",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
