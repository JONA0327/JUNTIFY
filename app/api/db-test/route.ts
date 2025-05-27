import { NextResponse } from "next/server"
import { getConnection } from "@/utils/database"

export async function GET() {
  try {
    console.log("Iniciando prueba de conexión a la base de datos")

    // Intentar obtener una conexión
    const client = await getConnection()

    // Obtener información de la conexión
    const connectionInfo = await client.query("SELECT current_database(), current_user, inet_server_addr() as host")

    // Verificar las tablas principales
    const tables = ["meetings", "transcriptions", "key_points", "meeting_keywords", "tasks", "task_comments"]

    const tableResults = []

    for (const table of tables) {
      try {
        // Verificar si la tabla existe
        const tableExists = await client.query(
          `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )
        `,
          [table],
        )

        const exists = tableExists.rows[0].exists

        let count = null
        if (exists) {
          // Contar registros en la tabla
          const countResult = await client.query(`SELECT COUNT(*) FROM ${table}`)
          count = Number.parseInt(countResult.rows[0].count)
        }

        tableResults.push({
          name: table,
          exists,
          count: exists ? count : undefined,
        })
      } catch (error) {
        console.error(`Error al verificar la tabla ${table}:`, error)
        tableResults.push({
          name: table,
          exists: false,
          error: String(error),
        })
      }
    }

    // Liberar la conexión
    client.release()

    // Devolver resultados
    return NextResponse.json({
      success: true,
      connection: {
        database: connectionInfo.rows[0].current_database,
        user: connectionInfo.rows[0].current_user,
        host: connectionInfo.rows[0].host,
      },
      tables: tableResults,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error en la prueba de conexión:", error)

    return NextResponse.json(
      {
        success: false,
        error: `Error de conexión: ${error.message}`,
        details: String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
