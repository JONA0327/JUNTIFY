import { NextResponse } from "next/server"
import { getConnection } from "@/utils/mysql"

export async function GET() {
  let connection
  try {
    connection = await getConnection()

    // Verificar la estructura de la tabla meetings
    const [meetingsColumns] = await connection.execute(`
      DESCRIBE meetings
    `)

    // Verificar si existe la columna speaker_map
    const [speakerMapColumn] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'meetings' AND COLUMN_NAME = 'speaker_map'
    `)

    // Si no existe la columna speaker_map, añadirla
    if ((speakerMapColumn as any[]).length === 0) {
      await connection.execute(`
        ALTER TABLE meetings ADD COLUMN speaker_map TEXT NULL
      `)
    }

    // Verificar la columna de usuario
    const [userColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'meetings' AND (COLUMN_NAME = 'supabase_user_id' OR COLUMN_NAME = 'user_id')
    `)

    // Verificar la relación entre meetings y users
    const [userTableColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'users' AND (COLUMN_NAME = 'id' OR COLUMN_NAME = 'supabase_id')
    `)

    return NextResponse.json({
      success: true,
      meetingsColumns: meetingsColumns,
      speakerMapColumn: speakerMapColumn,
      userColumns: userColumns,
      userTableColumns: userTableColumns,
      message: "Verificación y corrección de la estructura de la tabla meetings completada",
    })
  } catch (error) {
    console.error("Error al verificar/corregir la estructura de la tabla meetings:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al verificar/corregir la estructura de la tabla",
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
