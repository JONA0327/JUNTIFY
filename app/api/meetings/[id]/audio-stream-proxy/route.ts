import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/utils/mysql"
import { createGoogleDriveService } from "@/utils/google-drive-service"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const meetingId = params.id
    const username = request.headers.get("X-Username")

    if (!meetingId) {
      return NextResponse.json({ error: "Meeting ID is required" }, { status: 400 })
    }

    if (!username) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
    }

    console.log(`Finding audio for meeting ${meetingId}`)

    // Obtener información de la reunión
    const meetingResult = await query(
      "SELECT * FROM meetings WHERE id = ? AND username = ?",
      [meetingId, username],
    )

    if (!meetingResult || meetingResult.length === 0) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 })
    }

    const meeting = meetingResult[0]

    // Verificar si hay un ID de carpeta de grabaciones
    if (!meeting.recordings_folder_id) {
      return NextResponse.json({ error: "This meeting doesn't have an associated recordings folder" }, { status: 404 })
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
      return NextResponse.json({ error: "No audio files found in the recordings folder" }, { status: 404 })
    }

    // Tomar el primer archivo de audio encontrado
    const audioFile = audioFiles[0]

    // Redirigir al endpoint de streaming
    return NextResponse.redirect(new URL(`/api/audio-stream/${audioFile.id}`, request.url))
  } catch (error) {
    console.error("Error finding audio file:", error)
    return NextResponse.json({ error: `Error finding audio file: ${error.message}` }, { status: 500 })
  }
}
