import { type NextRequest, NextResponse } from "next/server"
import { query, queryOne } from "@/utils/mysql"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await request.json()
    const groupId = params.id

    if (!userId) {
      return NextResponse.json({ error: "Se requiere ID de usuario" }, { status: 400 })
    }

    // Verificar si el grupo existe
    const group = await queryOne("SELECT id FROM `groups` WHERE id = ?", [groupId])
    if (!group) {
      return NextResponse.json({ error: "Grupo no encontrado" }, { status: 404 })
    }

    // Verificar si el usuario ya pertenece a un grupo
    const userGroup = await queryOne("SELECT group_id FROM users WHERE id = ?", [userId])
    if (userGroup && userGroup.group_id) {
      return NextResponse.json({ error: "El usuario ya pertenece a un grupo" }, { status: 400 })
    }

    // Asignar el usuario al grupo
    await query("UPDATE users SET group_id = ? WHERE id = ?", [groupId, userId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al añadir miembro al grupo:", error)
    return NextResponse.json({ error: "Error al añadir miembro al grupo" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const groupId = params.id

    // Verificar si el grupo existe
    const group = await queryOne("SELECT id FROM `groups` WHERE id = ?", [groupId])
    if (!group) {
      return NextResponse.json({ error: "Grupo no encontrado" }, { status: 404 })
    }

    // Obtener miembros del grupo
    const members = await query("SELECT id, username, email, full_name, is_admin FROM users WHERE group_id = ?", [
      groupId,
    ])

    return NextResponse.json(members)
  } catch (error) {
    console.error("Error al obtener miembros del grupo:", error)
    return NextResponse.json({ error: "Error al obtener miembros del grupo" }, { status: 500 })
  }
}
