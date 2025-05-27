import { NextResponse } from "next/server"
import { getConnection } from "@/utils/mysql"

export async function GET() {
  let connection
  try {
    connection = await getConnection()

    // Verificar si la columna speaker_map existe en la tabla meetings
    const [meetingsColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'meetings' 
      AND COLUMN_NAME = 'speaker_map'
    `)

    const meetingsColumnsArray = meetingsColumns as any[]

    if (meetingsColumnsArray.length === 0) {
      // La columna no existe, crearla
      await connection.execute(`
        ALTER TABLE meetings
        ADD COLUMN speaker_map TEXT NULL
      `)
      console.log("Columna speaker_map añadida a la tabla meetings")
    } else {
      console.log("La columna speaker_map ya existe en la tabla meetings")
    }

    // Verificar si la columna display_speaker existe en la tabla transcriptions
    const [transcriptionsColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'transcriptions' 
      AND COLUMN_NAME = 'display_speaker'
    `)

    const transcriptionsColumnsArray = transcriptionsColumns as any[]

    if (transcriptionsColumnsArray.length === 0) {
      // La columna no existe, crearla
      await connection.execute(`
        ALTER TABLE transcriptions
        ADD COLUMN display_speaker VARCHAR(255) NULL
      `)
      console.log("Columna display_speaker añadida a la tabla transcriptions")

      // Inicializar display_speaker con el valor de speaker
      await connection.execute(`
        UPDATE transcriptions 
        SET display_speaker = speaker 
        WHERE display_speaker IS NULL
      `)
      console.log("Valores iniciales de display_speaker actualizados")
    } else {
      console.log("La columna display_speaker ya existe en la tabla transcriptions")
    }

    return NextResponse.json({
      success: true,
      message: "Estructura de tablas actualizada para hablantes",
    })
  } catch (error) {
    console.error("Error al actualizar la estructura de tablas para hablantes:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al actualizar la estructura de tablas",
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
