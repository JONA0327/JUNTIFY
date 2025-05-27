import { NextResponse } from "next/server"
import { getConnection } from "@/utils/mysql"

export async function GET() {
  let connection
  try {
    connection = await getConnection()

    // Verificar la estructura de la tabla transcriptions
    const [transcriptionsStructure] = await connection.execute(`
      DESCRIBE transcriptions
    `)

    // Verificar la estructura de la tabla meetings
    const [meetingsStructure] = await connection.execute(`
      DESCRIBE meetings
    `)

    // Obtener una muestra de datos de transcriptions
    const [transcriptionsSample] = await connection.execute(`
      SELECT * FROM transcriptions LIMIT 5
    `)

    // Obtener una muestra de datos de meetings
    const [meetingsSample] = await connection.execute(`
      SELECT * FROM meetings LIMIT 5
    `)

    return NextResponse.json({
      success: true,
      transcriptionsStructure,
      meetingsStructure,
      transcriptionsSample,
      meetingsSample,
    })
  } catch (error) {
    console.error("Error al verificar la estructura de las tablas:", error)
    return NextResponse.json(
      {
        error: "Error al verificar la estructura de las tablas",
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
