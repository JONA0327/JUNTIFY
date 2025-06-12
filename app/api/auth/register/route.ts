import { NextRequest, NextResponse } from "next/server"
import { query, queryOne } from "@/utils/mysql"
import { v4 as uuidv4 } from "uuid"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { email, password, username, full_name } = await request.json()

    if (!email || !password || !username || !full_name) {
      return NextResponse.json({ error: "Faltan campos" }, { status: 400 })
    }

    // Comprobar duplicados
    const existing = await queryOne(
      "SELECT id FROM users WHERE email = ? OR username = ?",
      [email, username],
    )
    if (existing) {
      return NextResponse.json(
        { error: "Usuario ya existe" },
        { status: 409 },
      )
    }

    const hashed = await bcrypt.hash(password, 10)
    const id = uuidv4()
    await query(
      `INSERT INTO users (id, username, full_name, email, password, role)
       VALUES (?, ?, ?, ?, ?, 'free')`,
      [id, username, full_name, email, hashed],
    )

    return NextResponse.json({ id, username, email })
  } catch (error) {
    console.error("Error en registro:", error)
    return NextResponse.json(
      { error: "Error al registrar usuario" },
      { status: 500 },
    )
  }
}
