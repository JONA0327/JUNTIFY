import { type NextRequest, NextResponse } from "next/server"
import { meetingService } from "@/services/meetingService"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const meetingId = Number.parseInt(params.id)
    const username = request.headers.get("X-Username")

    if (!username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (isNaN(meetingId)) {
      return NextResponse.json({ error: "Invalid meeting ID" }, { status: 400 })
    }

    // Verificar que la reunión pertenece al usuario
    const meeting = await meetingService.getMeetingById(meetingId, username)

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 })
    }

    // Obtener la transcripción
    const transcription = await meetingService.getTranscription(meetingId)

    return NextResponse.json(transcription)
  } catch (error) {
    console.error("Error getting transcription:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
