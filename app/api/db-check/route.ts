import { NextResponse } from "next/server"
import { query } from "@/utils/mysql"

export async function GET(request: Request) {
  try {
    // Verificar la estructura de la tabla de tareas
    const taskTableInfo = await query(`DESCRIBE tasks`)

    // Verificar la estructura de la tabla de reuniones
    const meetingTableInfo = await query(`DESCRIBE meetings`)

    return NextResponse.json({
      taskTable: taskTableInfo,
      meetingTable: meetingTableInfo,
    })
  } catch (error) {
    console.error("Error checking database structure:", error)
    return NextResponse.json(
      {
        error: "Error checking database structure",
        details: String(error),
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
