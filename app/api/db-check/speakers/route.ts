import { NextResponse } from "next/server"
import { getConnection } from "@/utils/mysql"

export async function GET() {
  let connection
  try {
    connection = await getConnection()

    // Verificar si la tabla meetings existe
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'meetings'
    `)

    const tablesArray = tables as any[]

    if (tablesArray.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "La tabla meetings no existe",
        },
        { status: 404 },
      )
    }

    // Verificar si la columna speaker_map existe en la tabla meetings
    const [meetingsColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'meetings' 
      AND COLUMN_NAME = 'speaker_map'
    `)

    const meetingsColumnsArray = meetingsColumns as any[]

    // Verificar si la tabla transcriptions existe
    const [transcriptionTables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'transcriptions'
    `)

    const transcriptionTablesArray = transcriptionTables as any[]

    let transcriptionsColumnsArray = []

    if (transcriptionTablesArray.length > 0) {
      // Verificar si la columna display_speaker existe en la tabla transcriptions
      const [transcriptionsColumns] = await connection.execute(`
        SELECT COLUMN_NAME, DATA_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'transcriptions' 
        AND COLUMN_NAME = 'display_speaker'
      `)

      transcriptionsColumnsArray = transcriptionsColumns as any[]
    }

    return NextResponse.json({
      success: true,
      structure: {
        meetingsTable: tablesArray.length > 0,
        speakerMapColumn: meetingsColumnsArray.length > 0 ? meetingsColumnsArray[0] : null,
        transcriptionsTable: transcriptionTablesArray.length > 0,
        displaySpeakerColumn: transcriptionsColumnsArray.length > 0 ? transcriptionsColumnsArray[0] : null,
      },
    })
  } catch (error) {
    console.error("Error al verificar la estructura de la base de datos:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al verificar la estructura de la base de datos",
      },
      { status: 500 },
    )
  } finally {
    if (connection) {
      connection.release()
    }
  }
}
