import { type NextRequest, NextResponse } from "next/server"
import { query, queryOne } from "@/utils/mysql"

export async function PUT(request: NextRequest, { params }: { params: { id: string; userId: string } }) {
  try {
    const groupId = params.id
    const userId = params.userId
    const username = request.headers.get("X-Username")

    if (!username) {
      return NextResponse.json({ error: "Se requiere nombre de usuario" }, { status: 400 })
    }

    // Verificar si el grupo existe
    const group = await queryOne("SELECT id FROM `groups` WHERE id = ?", [groupId])
    if (!group) {
      return NextResponse.json({ error: "Grupo no encontrado" }, { status: 404 })
    }

    // Verificar si el usuario que hace la solicitud es administrador
    const requestingUser = await queryOne("SELECT is_admin FROM users WHERE username = ? AND group_id = ?", [
      username,
      groupId,
    ])

    if (!requestingUser || !requestingUser.is_admin) {
      return NextResponse.json({ error: "No tienes permisos para realizar esta acción" }, { status: 403 })
    }

    // Verificar si el usuario a promover existe en el grupo
    const targetUser = await queryOne("SELECT id FROM users WHERE id = ? AND group_id = ?", [userId, groupId])

    if (!targetUser) {
      return NextResponse.json({ error: "Usuario no encontrado en el grupo" }, { status: 404 })
    }

    // Promover al usuario a administrador
    await query("UPDATE users SET is_admin = 1 WHERE id = ?", [userId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al promover miembro a administrador:", error)
    return NextResponse.json({ error: "Error al promover miembro a administrador" }, { status: 500 })
  }
}
