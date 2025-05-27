import { NextResponse } from "next/server"
import { getConnection } from "@/utils/mysql"

export async function GET() {
  let connection
  try {
    // Obtener conexión a la base de datos
    connection = await getConnection()

    // Verificar si la columna speaker_map existe
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'meetings' 
      AND COLUMN_NAME = 'speaker_map'
    `)

    const columnsArray = columns as any[]

    if (columnsArray.length === 0) {
      // La columna no existe, crearla
      console.log("La columna speaker_map no existe, creándola...")
      await connection.execute(`
        ALTER TABLE meetings
        ADD COLUMN speaker_map JSON DEFAULT NULL
      `)

      return NextResponse.json({
        success: true,
        message: "Columna speaker_map creada correctamente",
      })
    }

    return NextResponse.json({
      success: true,
      message: "La columna speaker_map ya existe",
    })
  } catch (error) {
    console.error("Error al configurar la columna speaker_map:", error)
    return NextResponse.json(
      {
        error: "Error al configurar la columna speaker_map",
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
