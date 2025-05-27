import { type NextRequest, NextResponse } from "next/server"
import { getConnection } from "@/utils/mysql"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  let connection
  try {
    const username = request.headers.get("X-Username")
    if (!username) {
      return NextResponse.json({ error: "No se proporcionó nombre de usuario" }, { status: 401 })
    }

    const meetingId = params.id
    const body = await request.json()
    const speakerMap = body.speakerMap

    console.log("Recibido speakerMap:", JSON.stringify(speakerMap))

    if (!speakerMap) {
      return NextResponse.json({ error: "No se proporcionó mapa de hablantes" }, { status: 400 })
    }

    // Obtener conexión a la base de datos
    connection = await getConnection()

    // Verificar que el meeting_id existe en la tabla transcriptions
    const [transcriptions] = await connection.execute(
      "SELECT COUNT(*) as count FROM transcriptions WHERE meeting_id = ?",
      [meetingId],
    )

    const transcriptionsArray = transcriptions as any[]
    if (transcriptionsArray[0].count === 0) {
      return NextResponse.json({ error: "No se encontraron transcripciones para esta reunión" }, { status: 404 })
    }

    // Actualizar cada hablante según el mapa
    let successCount = 0
    for (const [originalSpeaker, newSpeaker] of Object.entries(speakerMap)) {
      console.log(`Actualizando hablante: ${originalSpeaker} -> ${newSpeaker}`)

      const [result] = await connection.execute(
        "UPDATE transcriptions SET speaker = ? WHERE meeting_id = ? AND speaker = ?",
        [newSpeaker, meetingId, originalSpeaker],
      )

      const updateResult = result as any
      if (updateResult.affectedRows > 0) {
        successCount += updateResult.affectedRows
      }
    }

    return NextResponse.json({
      success: true,
      message: `Nombres de hablantes actualizados correctamente. ${successCount} registros actualizados.`,
    })
  } catch (error) {
    console.error("Error al actualizar los hablantes:", error)
    return NextResponse.json(
      {
        error: "No se pudieron guardar los cambios de hablantes. Inténtalo de nuevo.",
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
