import { NextResponse } from "next/server"
import { getConnection } from "@/utils/mysql"

export async function GET() {
  let connection
  try {
    connection = await getConnection()

    // Obtener la estructura de la tabla transcriptions
    const [columns] = await connection.execute(`
      SHOW COLUMNS FROM transcriptions
    `)

    // Obtener una muestra de datos
    const [sample] = await connection.execute(`
      SELECT * FROM transcriptions LIMIT 5
    `)

    // Obtener hablantes únicos
    const [speakers] = await connection.execute(`
      SELECT DISTINCT speaker FROM transcriptions
    `)

    return NextResponse.json({
      success: true,
      structure: columns,
      sample: sample,
      speakers: speakers,
    })
  } catch (error) {
    console.error("Error al obtener la estructura de la tabla transcriptions:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener la estructura de la tabla",
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
