import { NextResponse } from "next/server"
import { queryOne } from "@/utils/mysql"
import bcrypt from "bcryptjs"
import { SignJWT } from "jose"

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

    const secret = new TextEncoder().encode(process.env.JWT_SECRET as string)
    const token = await new SignJWT({ id: user.id, username: user.username })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(secret)

    const userInfo = {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      roles: user.roles,
      organization: user.organization,
    }

    const response = NextResponse.json({ token, user: userInfo }, { status: 200 })
    response.cookies.set("auth_token", token, { httpOnly: true, path: "/" })
    return response
  } catch (error) {
    console.error("Error logging in:", error)
    return NextResponse.json({ error: "Error logging in" }, { status: 500 })
  }
}
