import { NextResponse } from "next/server"
import { query } from "@/utils/mysql"

export async function GET(request: Request) {
  try {
    // Get username from the request headers
    const username = request.headers.get("X-Username")

    if (!username) {
      return NextResponse.json({ error: "Unauthorized - Username not provided" }, { status: 401 })
    }

    const now = new Date()
    const currentMonth = now.getMonth() + 1 // JavaScript months are 0-indexed
    const currentYear = now.getFullYear()

    // Get usage count from database
    const usageRecords = await query(
      `SELECT COUNT(*) as count FROM meetings 
       WHERE username = ? 
       AND MONTH(created_at) = ? 
       AND YEAR(created_at) = ?`,
      [username, currentMonth, currentYear],
    )

    const used = usageRecords[0]?.count || 0
    const limit = 50 // Límite de 50 análisis mensuales
    const remaining = Math.max(0, limit - used)

    return NextResponse.json({
      used,
      limit,
      remaining,
    })
  } catch (error) {
    console.error("Error fetching user usage:", error)
    return NextResponse.json({ error: "Error processing request" }, { status: 500 })
  }
}
