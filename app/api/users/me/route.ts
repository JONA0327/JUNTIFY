import { NextResponse } from "next/server"
import { getUsernameFromRequest } from "@/utils/user-helpers"
import type { NextRequest } from "next/server"
import { queryOne } from "@/utils/mysql"

export async function GET(request: NextRequest) {
  try {
    // Obtener el username del request
    const username = await getUsernameFromRequest(request)

    if (!username) {
      return NextResponse.json({ error: "Unauthorized - Username not provided" }, { status: 401 })
    }

    const userData = await queryOne(
      "SELECT id, username, full_name, email, roles, organization FROM users WHERE username = ? OR email = ?",
      [username, username],
    )

    if (!userData) {
      return NextResponse.json({
        id: "temp-id",
        name: username,
        email: username,
        organization: "Default Organization",
      })
    }

    const userInfo = {
      id: userData.id,
      email: userData.email,
      name: userData.full_name || "",
      role: userData.roles,
      organization: userData.organization || "",
    }

    return NextResponse.json(userInfo)
  } catch (error) {
    console.error("Error fetching user info:", error)
    return NextResponse.json({ error: "Error fetching user info" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Obtener el username del request
    const username = await getUsernameFromRequest(request)

    if (!username) {
      return NextResponse.json({ error: "Unauthorized - Username not provided" }, { status: 401 })
    }

    const data = await request.json()
    const { name } = data

    if (name) {
      await queryOne(
        "UPDATE users SET full_name = ? WHERE username = ? OR email = ?",
        [name, username, username],
      )
    }

    const updated = await queryOne(
      "SELECT id, username, full_name, email, roles, organization FROM users WHERE username = ? OR email = ?",
      [username, username],
    )

    return NextResponse.json({
      id: updated?.id || "temp-id",
      name: updated?.full_name || username,
      email: updated?.email || username,
      role: updated?.roles,
      organization: updated?.organization || "",
    })
  } catch (error) {
    console.error("Error updating user info:", error)
    return NextResponse.json({ error: "Error updating user info" }, { status: 500 })
  }
}
