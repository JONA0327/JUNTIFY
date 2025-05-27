import { type NextRequest, NextResponse } from "next/server"
import { query, queryOne } from "@/utils/mysql"

export async function GET(request: NextRequest) {
  try {
    // Obtener el username del header
    const username = request.headers.get("X-Username")

    if (!username) {
      return NextResponse.json({ error: "Se requiere nombre de usuario" }, { status: 400 })
    }

    // Obtener el ID del usuario y su organización
    const user = await queryOne("SELECT id, group_id, is_admin FROM users WHERE username = ?", [username])

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    if (!user.group_id) {
      return NextResponse.json({ error: "Usuario sin organización" }, { status: 404 })
    }

    // Obtener información de la organización
    const organization = await queryOne("SELECT id, name, invitation_code as code FROM `groups` WHERE id = ?", [
      user.group_id,
    ])

    if (!organization) {
      return NextResponse.json({ error: "Organización no encontrada" }, { status: 404 })
    }

    // Obtener miembros de la organización
    const members = await query(
      `SELECT u.id, u.username, u.email, u.full_name, u.is_admin 
       FROM users u 
       WHERE u.group_id = ?`,
      [user.group_id],
    )

    return NextResponse.json({
      organization,
      isAdmin: user.is_admin === 1,
      members,
    })
  } catch (error) {
    console.error("Error al obtener información de la organización:", error)
    return NextResponse.json({ error: "Error al obtener información de la organización" }, { status: 500 })
  }
}
