
import { NextResponse } from "next/server"
import { query } from "@/utils/mysql"
import bcrypt from "bcryptjs"
import { v4 as uuidv4 } from "uuid"
import { SignJWT } from "jose"

export async function POST(request: Request) {
  try {
    const { username, full_name, email, password } = await request.json()

    if (!username || !email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const id = uuidv4()
    const hash = await bcrypt.hash(password, 10)

    await query(
      `INSERT INTO users (id, username, full_name, email, password, roles, organization)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, username, full_name || null, email, hash, "free", null],
    )

    const secret = new TextEncoder().encode(process.env.JWT_SECRET as string)
    const token = await new SignJWT({ id, username })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(secret)

    const user = {
      id,
      username,
      full_name: full_name || null,
      email,
      roles: "free",
      organization: null,
    }

    const response = NextResponse.json({ token, user }, { status: 201 })
    response.cookies.set("auth_token", token, { httpOnly: true, path: "/" })
    return response
  } catch (error) {
    console.error("Error registrando usuario:", error)
    return NextResponse.json(
      { error: "Error registering user" },
      { status: 500 },
    )
  }
}
