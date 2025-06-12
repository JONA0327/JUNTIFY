import { NextResponse } from "next/server"
import { queryOne } from "@/utils/mysql"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const { email, username, password } = await request.json()

    if ((!email && !username) || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    // Permitir iniciar sesión con email o username
    const user = email
      ? await queryOne("SELECT * FROM users WHERE email = ?", [email])
      : await queryOne("SELECT * FROM users WHERE username = ?", [username])

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    return NextResponse.json({ message: "Login successful", username: user.username })
  } catch (error) {
    console.error("Error logging in:", error)
    return NextResponse.json({ error: "Error logging in" }, { status: 500 })
  }
}
