import { NextResponse } from "next/server"
import { queryOne, query } from "@/utils/mysql"
import { v4 as uuidv4 } from "uuid"
import { sendPasswordResetEmail } from "@/utils/email"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 })
    }

    const user = await queryOne("SELECT id FROM users WHERE email = ?", [email])
    if (user) {
      const token = uuidv4()
      const expires = new Date(Date.now() + 15 * 60 * 1000)
      await query(
        "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
        [user.id, token, expires],
      )
      sendPasswordResetEmail(email, token).catch((err) => {
        console.error("Password reset email failed", err)
      })
    }

    return NextResponse.json({ message: "If the email exists, a reset link has been sent" })
  } catch (error) {
    console.error("Error requesting password reset:", error)
    return NextResponse.json({ error: "Error requesting password reset" }, { status: 500 })
  }
}
