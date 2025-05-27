import { NextResponse } from "next/server"
import { getConnection } from "@/utils/mysql"

export async function GET() {
  let connection
  try {
    connection = await getConnection()

    // Verificar la estructura de la tabla transcriptions
    const [structure] = await connection.execute(`
      DESCRIBE transcriptions
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
      structure,
      sample,
      speakers,
    })
  } catch (error) {
    console.error("Error al verificar la tabla transcriptions:", error)
    return NextResponse.json(
      {
        error: "Error al verificar la tabla transcriptions",
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
