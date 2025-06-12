import { NextResponse } from "next/server"
import { queryOne } from "@/utils/mysql"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "Faltan credenciales" }, { status: 400 })
    }

    const user = await queryOne(
      "SELECT id, username, password, role FROM users WHERE username = ? OR email = ?",
      [username, username],
    )

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, roles: user.role },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1h" },
    )

    return NextResponse.json({ token })
  } catch (error) {
    console.error("Error en login:", error)
    return NextResponse.json({ error: "Error al iniciar sesión" }, { status: 500 })
  }
}
