import { type NextRequest, NextResponse } from "next/server"
import { meetingService } from "@/services/meetingService"
import { query } from "@/utils/mysql"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Obtener el ID de la reunión de los parámetros
    const meetingId = Number.parseInt(params.id)
    if (isNaN(meetingId)) {
      return NextResponse.json({ error: "ID de reunión inválido" }, { status: 400 })
    }

    // Obtener el nombre de usuario de la solicitud
    const username = request.headers.get("X-Username")

    if (!username) {
      console.error("No se encontró el nombre de usuario en la solicitud")
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
    }

    console.log(`API: Obteniendo detalles de la reunión ${meetingId} para el usuario ${username}`)

    // Obtener los detalles completos de la reunión
    const meeting = await meetingService.getMeetingById(meetingId, username)
    if (!meeting) {
      return NextResponse.json({ error: "Reunión no encontrada" }, { status: 404 })
    }

    // Contar participantes únicos basados en los hablantes de la transcripción
    const participantsResult = await query(
      "SELECT COUNT(DISTINCT speaker) as count FROM transcriptions WHERE meeting_id = ? AND speaker IS NOT NULL AND speaker != ''",
      [meetingId],
    )

    const participantCount = participantsResult[0]?.count || 0

    // Actualizar el campo de participantes si hay hablantes
    if (participantCount > 0) {
      meeting.participants = participantCount
    }

    // Asegurarse de que los arrays estén inicializados correctamente
    const formattedMeeting = {
      ...meeting,
      transcription: meeting.transcription || [],
      keyPoints: meeting.keyPoints || [],
      tasks: meeting.tasks || [],
      keywords: meeting.keywords || [],
    }

    // Devolver los detalles de la reunión
    return NextResponse.json(formattedMeeting)
  } catch (error) {
    console.error("Error al obtener detalles de la reunión:", error)
    return NextResponse.json({ error: "Error al obtener detalles de la reunión" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Obtener el ID de la reunión de los parámetros
    const meetingId = Number.parseInt(params.id)
    if (isNaN(meetingId)) {
      return NextResponse.json({ error: "ID de reunión inválido" }, { status: 400 })
    }

    // Obtener el nombre de usuario de la solicitud
    const username = request.headers.get("X-Username")

    if (!username) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
    }

    // Obtener los datos de actualización del cuerpo de la solicitud
    const updateData = await request.json()

    // Actualizar la reunión
    const updatedMeeting = await meetingService.updateMeeting(meetingId, username, updateData)
    if (!updatedMeeting) {
      return NextResponse.json({ error: "No se pudo actualizar la reunión" }, { status: 400 })
    }

    // Devolver la reunión actualizada
    return NextResponse.json(updatedMeeting)
  } catch (error) {
    console.error("Error al actualizar la reunión:", error)
    return NextResponse.json({ error: "Error al actualizar la reunión" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Obtener el ID de la reunión de los parámetros
    const meetingId = Number.parseInt(params.id)
    if (isNaN(meetingId)) {
      return NextResponse.json({ error: "ID de reunión inválido" }, { status: 400 })
    }

    // Obtener el nombre de usuario de la solicitud
    const username = request.headers.get("X-Username")

    if (!username) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
    }

    // Eliminar la reunión
    const success = await meetingService.deleteMeeting(meetingId, username)
    if (!success) {
      return NextResponse.json({ error: "No se pudo eliminar la reunión" }, { status: 400 })
    }

    // Devolver éxito
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al eliminar la reunión:", error)
    return NextResponse.json({ error: "Error al eliminar la reunión" }, { status: 500 })
  }
}
