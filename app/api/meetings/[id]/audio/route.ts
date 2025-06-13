import { type NextRequest, NextResponse } from "next/server"
import { createGoogleDriveService } from "@/utils/google-drive-service"
import { query } from "@/utils/mysql"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const meetingId = params.id
    const username = request.headers.get("X-Username")

    if (!username) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
    }

    // Obtener información de la reunión
    const meetingResult = await query(
      "SELECT * FROM meetings WHERE id = ? AND username = ?",
      [meetingId, username],
    )

    if (!meetingResult || meetingResult.length === 0) {
      return NextResponse.json({ error: "Reunión no encontrada" }, { status: 404 })
    }

    const meeting = meetingResult[0]

    // Verificar si hay un ID de carpeta de grabaciones
    if (!meeting.recordings_folder_id) {
      return NextResponse.json({ error: "Esta reunión no tiene una carpeta de grabaciones asociada" }, { status: 404 })
    }

    // Crear una instancia del servicio de Google Drive
    const driveService = createGoogleDriveService()

    // Verificar que la carpeta existe
    const folderExists = await driveService.checkFolderExists(meeting.recordings_folder_id).catch(() => false)
    if (!folderExists) {
      return NextResponse.json({ error: "La carpeta de grabaciones no existe" }, { status: 404 })
    }

    // Devolver la información de la carpeta
    return NextResponse.json({
      success: true,
      recordingsFolderId: meeting.recordings_folder_id,
    })
  } catch (error) {
    console.error("Error al obtener información de audio:", error)
    return NextResponse.json({ error: "Error al obtener información de audio" }, { status: 500 })
  }
}
