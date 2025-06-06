import { NextResponse } from "next/server"
import { query } from "@/utils/mysql"
import { getUsernameFromRequest } from "@/utils/user-helpers"

export async function POST(request: Request) {
  try {
    const { message } = await request.json()
    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 })
    }

    const username = await getUsernameFromRequest(request)
    await query(
      "INSERT INTO feedback (username, message, created_at) VALUES (?, ?, NOW())",
      [username || null, message.trim()]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error guardando feedback:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
