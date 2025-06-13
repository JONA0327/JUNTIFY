import { NextResponse } from "next/server"
import { queryOne, query } from "@/utils/mysql"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()
    if (!token || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const record = await queryOne(
      "SELECT user_id, expires_at, used FROM password_reset_tokens WHERE token = ?",
      [token],
    )

    if (!record || record.used || new Date(record.expires_at) < new Date()) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 })
    }

    const hash = await bcrypt.hash(password, 10)
    await query("UPDATE users SET password = ? WHERE id = ?", [hash, record.user_id])
    await query("UPDATE password_reset_tokens SET used = 1 WHERE token = ?", [token])

    return NextResponse.json({ message: "Password updated" })
  } catch (error) {
    console.error("Error resetting password:", error)
    return NextResponse.json({ error: "Error resetting password" }, { status: 500 })
  }
}
