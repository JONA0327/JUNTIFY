import { NextResponse } from "next/server"
import { query } from "@/utils/mysql"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const { username, email, password } = await request.json()
    if (!username || !email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const hash = await bcrypt.hash(password, 10)
    await query(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, hash],
    )

    return NextResponse.json({ message: "Usuario registrado" }, { status: 201 })
  } catch (error) {
    console.error("Error registrando usuario:", error)
    return NextResponse.json({ error: "Error registering user" }, { status: 500 })
  }
}
