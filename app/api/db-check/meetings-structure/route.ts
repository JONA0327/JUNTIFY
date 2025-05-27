import { NextResponse } from "next/server"
import { getConnection } from "@/utils/mysql"

export async function GET() {
  let connection
  try {
    connection = await getConnection()

    // Obtener la estructura de la tabla meetings
    const [columnsInfo] = await connection.execute(`
      DESCRIBE meetings
    `)

    // Obtener una muestra de datos de la tabla meetings
    const [sampleData] = await connection.execute(`
      SELECT id, title, supabase_user_id, speaker_map 
      FROM meetings 
      LIMIT 1
    `)

    return NextResponse.json({
      success: true,
      tableStructure: columnsInfo,
      sampleData: sampleData,
    })
  } catch (error) {
    console.error("Error al verificar la estructura de la tabla meetings:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al verificar la estructura de la tabla",
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
