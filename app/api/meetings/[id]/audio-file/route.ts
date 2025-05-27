import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/utils/mysql"
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

    console.log(`Buscando audio para la reunión ${meetingId} del usuario ${username}`)

    // Crear una instancia del servicio de Google Drive
    const driveService = createGoogleDriveService()
    if (!driveService) {
      return NextResponse.json({ error: "No se pudo crear el servicio de Google Drive" }, { status: 500 })
    }

    // Buscar la carpeta "Juntify Recordings" existente o usar el ID de la carpeta de grabaciones
    let recordingsFolderId = null

    // Intentar obtener el ID de la carpeta de grabaciones de la reunión
    try {
      const meetingResult = await query("SELECT recordings_folder_id FROM meetings WHERE id = ?", [meetingId])
      if (meetingResult && meetingResult.length > 0 && meetingResult[0].recordings_folder_id) {
        recordingsFolderId = meetingResult[0].recordings_folder_id
        console.log(`Usando ID de carpeta de grabaciones de la reunión: ${recordingsFolderId}`)
      }
    } catch (err) {
      console.error("Error al consultar la reunión:", err)
    }

    // Si no hay ID en la reunión, buscar la carpeta "Juntify Recordings"
    if (!recordingsFolderId) {
      try {
        recordingsFolderId = await driveService.findJuntifyRecordingsFolder()
        console.log(`Usando ID de carpeta Juntify Recordings encontrada: ${recordingsFolderId}`)
      } catch (err) {
        console.error("Error al buscar carpeta Juntify Recordings:", err)
      }
    }

    // Si aún no tenemos un ID de carpeta, intentar obtenerlo de la configuración
    if (!recordingsFolderId) {
      try {
        const folderResult = await query("SELECT folder_id FROM google_drive_config WHERE username = ? LIMIT 1", [
          username,
        ]).catch(() => null)

        if (folderResult && folderResult.length > 0 && folderResult[0].folder_id) {
          recordingsFolderId = folderResult[0].folder_id
          console.log(`Usando ID de carpeta de la configuración: ${recordingsFolderId}`)
        }
      } catch (error) {
        console.error("Error al obtener la configuración de Google Drive:", error)
      }
    }

    // Si todavía no tenemos un ID de carpeta, usar el método getUserFolder
    if (!recordingsFolderId) {
      try {
        recordingsFolderId = await driveService.getUserFolder(username)
        console.log(`Usando ID de carpeta obtenida con getUserFolder: ${recordingsFolderId}`)
      } catch (error) {
        console.error("Error al obtener la carpeta del usuario:", error)
      }
    }

    // Si aún no tenemos un ID de carpeta, devolver un error
    if (!recordingsFolderId) {
      return NextResponse.json({ error: "No se pudo determinar la carpeta de grabaciones" }, { status: 404 })
    }

    // Verificar que la carpeta existe
    const folderExists = await driveService.checkFolderExists(recordingsFolderId).catch(() => false)
    if (!folderExists) {
      console.log(`La carpeta con ID ${recordingsFolderId} no existe`)
      return NextResponse.json({ error: "La carpeta de grabaciones no existe" }, { status: 404 })
    }

    console.log(`Carpeta de grabaciones encontrada: ${recordingsFolderId}`)

    // Listar todos los archivos en la carpeta de grabaciones
    console.log(`Listando archivos en la carpeta ${recordingsFolderId}`)
    const files = await driveService.listFiles(recordingsFolderId)

    if (!files || files.length === 0) {
      console.log(`No se encontraron archivos en la carpeta de grabaciones`)
      return NextResponse.json({ error: "No hay archivos en la carpeta de grabaciones" }, { status: 404 })
    }

    console.log(`Se encontraron ${files.length} archivos en la carpeta de grabaciones`)

    // Filtrar archivos de audio
    const audioFiles = files.filter((file) => {
      const mimeType = file.mimeType || ""
      const name = file.name || ""
      return (
        mimeType.includes("audio/") ||
        name.endsWith(".aac") ||
        name.endsWith(".mp3") ||
        name.endsWith(".wav") ||
        name.endsWith(".m4a")
      )
    })

    console.log(`Se encontraron ${audioFiles.length} archivos de audio`)

    // Buscar archivos que coincidan con el ID de la reunión
    const matchingFiles = audioFiles.filter((file) => {
      const fileName = file.name || ""

      // Buscar archivos que comiencen con el ID o contengan el ID en su nombre
      return (
        fileName.startsWith(`${meetingId}_`) ||
        fileName.includes(`_${meetingId}_`) ||
        fileName.includes(`_${meetingId}.`) ||
        fileName.includes(`${meetingId}.`)
      )
    })

    console.log(`Se encontraron ${matchingFiles.length} archivos que coinciden con el ID ${meetingId}`)

    if (matchingFiles.length === 0) {
      // Si no encontramos archivos con el patrón exacto, intentamos buscar archivos que contengan el ID
      const possibleMatches = audioFiles.filter((file) => {
        const fileName = file.name || ""
        return fileName.includes(meetingId)
      })

      console.log(`Búsqueda alternativa: ${possibleMatches.length} posibles coincidencias`)

      if (possibleMatches.length > 0) {
        // Usar la primera coincidencia
        const audioFile = possibleMatches[0]
        console.log(`Usando coincidencia alternativa: ${audioFile.name} (${audioFile.id})`)

        return NextResponse.json({
          success: true,
          fileId: audioFile.id,
          fileName: audioFile.name,
          fileSize: audioFile.size || 0,
          mimeType: audioFile.mimeType,
          note: "Coincidencia aproximada",
        })
      }

      return NextResponse.json(
        {
          error: "No se encontró el archivo de audio para esta reunión",
          meetingId,
          availableFiles: audioFiles.map((f) => f.name),
        },
        { status: 404 },
      )
    }

    // Tomar el primer archivo que coincida
    const audioFile = matchingFiles[0]
    console.log(`Archivo encontrado: ${audioFile.name} (${audioFile.id})`)

    return NextResponse.json({
      success: true,
      fileId: audioFile.id,
      fileName: audioFile.name,
      fileSize: audioFile.size || 0,
      mimeType: audioFile.mimeType,
    })
  } catch (error) {
    console.error("Error al buscar archivo de audio:", error)
    return NextResponse.json(
      {
        error: "Error al buscar archivo de audio",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
