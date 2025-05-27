import { NextResponse } from "next/server"
import { getConnection } from "@/utils/mysql"

export async function GET(request: Request) {
  let connection
  try {
    // Obtener parámetros de la URL
    const url = new URL(request.url)
    const meetingId = url.searchParams.get("meetingId")
    const oldSpeaker = url.searchParams.get("oldSpeaker")
    const newSpeaker = url.searchParams.get("newSpeaker")

    if (!meetingId || !oldSpeaker || !newSpeaker) {
      return NextResponse.json(
        {
          error: "Faltan parámetros. Se requiere meetingId, oldSpeaker y newSpeaker",
        },
        { status: 400 },
      )
    }

    connection = await getConnection()

    // Verificar si existen registros con ese hablante
    const [checkResult] = await connection.execute(
      "SELECT COUNT(*) as count FROM transcriptions WHERE meeting_id = ? AND speaker = ?",
      [meetingId, oldSpeaker],
    )

    const checkArray = checkResult as any[]
    const count = checkArray[0]?.count || 0

    if (count === 0) {
      return NextResponse.json({
        warning: `No se encontraron registros con el hablante "${oldSpeaker}" para la reunión ${meetingId}`,
      })
    }

    // Actualizar el hablante
    const [updateResult] = await connection.execute(
      "UPDATE transcriptions SET speaker = ? WHERE meeting_id = ? AND speaker = ?",
      [newSpeaker, meetingId, oldSpeaker],
    )

    return NextResponse.json({
      success: true,
      message: `Hablante "${oldSpeaker}" actualizado a "${newSpeaker}" en la reunión ${meetingId}`,
      result: updateResult,
    })
  } catch (error) {
    console.error("Error al actualizar el hablante:", error)
    return NextResponse.json(
      {
        error: "Error al actualizar el hablante",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  } finally {
    if (connection) {
      connection.release()
    }
  }
}
