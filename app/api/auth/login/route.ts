import { NextRequest, NextResponse } from "next/server"
import { queryOne } from "@/utils/mysql"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Faltan credenciales" }, { status: 400 })
    }

    const user = await queryOne(
      "SELECT id, username, password, role FROM users WHERE email = ?",
      [email],
    )
    if (!user) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" },
    )

    const response = NextResponse.json({ id: user.id, username: user.username })
    response.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })
    return response
  } catch (error) {
    console.error("Error en login:", error)
    return NextResponse.json({ error: "Error al iniciar sesión" }, { status: 500 })
  }
}
