import { type NextRequest, NextResponse } from "next/server"
import { query, queryOne } from "@/utils/mysql"

export async function DELETE(request: NextRequest, { params }: { params: { id: string; userId: string } }) {
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
    const requestingUser = await queryOne("SELECT id, is_admin FROM users WHERE username = ? AND group_id = ?", [
      username,
      groupId,
    ])

    // Si el usuario que hace la solicitud es el mismo que se quiere eliminar, permitir
    const isSelfRemoval = requestingUser && requestingUser.id.toString() === userId

    // Si no es administrador ni es el mismo usuario, denegar
    if (!requestingUser || (!requestingUser.is_admin && !isSelfRemoval)) {
      return NextResponse.json({ error: "No tienes permisos para realizar esta acción" }, { status: 403 })
    }

    // Verificar si el usuario a eliminar existe en el grupo
    const targetUser = await queryOne("SELECT id, is_admin FROM users WHERE id = ? AND group_id = ?", [userId, groupId])

    if (!targetUser) {
      return NextResponse.json({ error: "Usuario no encontrado en el grupo" }, { status: 404 })
    }

    // Si el usuario a eliminar es administrador y hay más administradores, permitir
    if (targetUser.is_admin) {
      const adminCount = await queryOne("SELECT COUNT(*) as count FROM users WHERE group_id = ? AND is_admin = 1", [
        groupId,
      ])

      // Si es el último administrador, no permitir eliminación
      if (adminCount.count <= 1) {
        return NextResponse.json({ error: "No se puede eliminar al último administrador del grupo" }, { status: 400 })
      }
    }

    // Eliminar al usuario del grupo (actualizar su group_id a NULL)
    await query("UPDATE users SET group_id = NULL, is_admin = 0 WHERE id = ?", [userId])

    // Si no quedan miembros, eliminar el grupo
    const memberCount = await queryOne("SELECT COUNT(*) as count FROM users WHERE group_id = ?", [groupId])
    if (memberCount.count === 0) {
      await query("DELETE FROM `groups` WHERE id = ?", [groupId])
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al eliminar miembro del grupo:", error)
    return NextResponse.json({ error: "Error al eliminar miembro del grupo" }, { status: 500 })
  }
}
