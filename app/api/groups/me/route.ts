import { type NextRequest, NextResponse } from "next/server"
import { query, queryOne } from "@/utils/mysql"

export async function GET(request: NextRequest) {
  try {
    // Obtener el username del header
    const username = request.headers.get("X-Username")

    if (!username) {
      return NextResponse.json({ error: "Se requiere nombre de usuario" }, { status: 400 })
    }

    // Obtener el ID del usuario y su grupo
    const user = await queryOne("SELECT id, group_id, is_admin FROM users WHERE username = ?", [username])

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    if (!user.group_id) {
      return NextResponse.json({ error: "Usuario sin grupo" }, { status: 404 })
    }

    // Obtener información del grupo
    const group = await queryOne("SELECT id, name, invitation_code as code FROM `groups` WHERE id = ?", [user.group_id])

    if (!group) {
      return NextResponse.json({ error: "Grupo no encontrado" }, { status: 404 })
    }

    // Obtener miembros del grupo
    const members = await query(
      `SELECT u.id, u.username, u.email, u.full_name, u.is_admin 
       FROM users u 
       WHERE u.group_id = ?`,
      [user.group_id],
    )

    return NextResponse.json({
      organization: group,
      isAdmin: user.is_admin === 1,
      members,
    })
  } catch (error) {
    console.error("Error al obtener información del grupo:", error)
    return NextResponse.json({ error: "Error al obtener información del grupo" }, { status: 500 })
  }
}
