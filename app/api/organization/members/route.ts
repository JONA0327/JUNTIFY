import { NextResponse } from "next/server"
import { query } from "@/utils/mysql"

export async function GET(request: Request) {
  try {
    // Get username from the request headers
    const username = request.headers.get("X-Username")

    if (!username) {
      return NextResponse.json({ error: "Unauthorized - Username not provided" }, { status: 401 })
    }

    const members = await query(
      `SELECT username, full_name FROM users WHERE organization = (
         SELECT organization FROM users WHERE username = ? OR email = ?
       )`,
      [username, username],
    )
    const mapped = members.map((m: any) => ({
      username: m.username,
      fullName: m.full_name,
    }))
    return NextResponse.json(mapped)
  } catch (error) {
    console.error("Error fetching organization members:", error)
    return NextResponse.json({ error: "Error fetching organization members" }, { status: 500 })
  }
}
