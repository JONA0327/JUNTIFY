import { NextResponse } from "next/server"
import { query } from "@/utils/mysql"

export async function GET() {
  try {
    // Verificar si la columna ya existe
    const checkColumnQuery = `
      SELECT COUNT(*) as column_exists 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'meetings' 
      AND COLUMN_NAME = 'recordings_folder_id'
    `

    const columnCheck = await query(checkColumnQuery)

    if (columnCheck[0].column_exists === 0) {
      // La columna no existe, agregarla
      await query(`
        ALTER TABLE meetings 
        ADD COLUMN recordings_folder_id VARCHAR(255) DEFAULT NULL
      `)

      return NextResponse.json({
        success: true,
        message: "Columna recordings_folder_id agregada correctamente a la tabla meetings",
      })
    } else {
      return NextResponse.json({
        success: true,
        message: "La columna recordings_folder_id ya existe en la tabla meetings",
      })
    }
  } catch (error) {
    console.error("Error al agregar columna recordings_folder_id a meetings:", error)
    return NextResponse.json({ error: "Error al modificar la estructura de la tabla" }, { status: 500 })
  }
}
