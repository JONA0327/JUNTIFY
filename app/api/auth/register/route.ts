
import { NextResponse } from "next/server"
import { query, queryOne } from "@/utils/mysql"
import bcrypt from "bcrypt"

export async function POST(request: Request) {
  try {
    const { username, password, email, full_name } = await request.json()

    if (!username || !password || !email || !full_name) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const existing = await queryOne(
      "SELECT id FROM users WHERE username = ? OR email = ?",
      [username, email],
    )
    if (existing) {
      return NextResponse.json({ error: "Usuario o email ya existe" }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 10)
    await query(
      "INSERT INTO users (username, password, email, full_name, role) VALUES (?, ?, ?, ?, ?)",
      [username, hashed, email, full_name, "free"],
    )

    return NextResponse.json({ message: "Usuario registrado" }, { status: 201 })
  } catch (error) {
    console.error("Error en registro:", error)
    return NextResponse.json({ error: "Error al registrar usuario" }, { status: 500 })

  }
}
