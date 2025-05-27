import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/utils/mysql"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const meetingId = params.id
    const username = request.headers.get("X-Username") || ""

    if (!meetingId) {
      return NextResponse.json({ error: "Meeting ID is required" }, { status: 400 })
    }

    console.log(`Buscando audio para la reunión ${meetingId} del usuario ${username}`)

    // Obtener información de la reunión
    const meetingResult = await query("SELECT * FROM meetings WHERE id = ?", [meetingId])

    if (!meetingResult || meetingResult.length === 0) {
      return NextResponse.json({ error: "Reunión no encontrada" }, { status: 404 })
    }

    const meeting = meetingResult[0]

    // Verificar si hay un ID de carpeta de grabaciones
    if (!meeting.recordings_folder_id) {
      return NextResponse.json({ error: "Esta reunión no tiene una carpeta de grabaciones asociada" }, { status: 404 })
    }

    // Buscar el archivo de audio en la carpeta de grabaciones
    const driveService = createGoogleDriveService()

    // Listar archivos en la carpeta
    const files = await driveService.listFiles(meeting.recordings_folder_id)

    // Buscar archivos de audio
    const audioFiles = files.filter(
      (file) =>
        file.mimeType.startsWith("audio/") ||
        file.name.endsWith(".mp3") ||
        file.name.endsWith(".aac") ||
        file.name.endsWith(".m4a") ||
        file.name.endsWith(".wav") ||
        file.name.endsWith(".webm"),
    )

    if (audioFiles.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron archivos de audio en la carpeta de grabaciones" },
        { status: 404 },
      )
    }

    // Tomar el primer archivo de audio encontrado
    const audioFile = audioFiles[0]

    // Redirigir al proxy
    return NextResponse.redirect(new URL(`/api/audio-proxy/${audioFile.id}`, request.url))
  } catch (error) {
    console.error("Error al buscar archivo de audio:", error)
    return NextResponse.json({ error: `Error al buscar archivo de audio: ${error.message}` }, { status: 500 })
  }
}

// Importar el servicio de Google Drive
import { createGoogleDriveService } from "@/utils/google-drive-service"
