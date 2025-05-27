import { type NextRequest, NextResponse } from "next/server"
import { query, queryOne } from "@/utils/mysql"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const { userId, name } = await request.json()

    if (!userId || !name) {
      return NextResponse.json({ error: "Se requiere ID de usuario y nombre de grupo" }, { status: 400 })
    }

    // Verificar si el usuario ya pertenece a un grupo
    const userGroup = await queryOne("SELECT group_id FROM users WHERE id = ?", [userId])
    if (userGroup && userGroup.group_id) {
      return NextResponse.json({ error: "El usuario ya pertenece a un grupo" }, { status: 400 })
    }

    // Generar código de invitación único
    const invitationCode = crypto.randomBytes(4).toString("hex").toUpperCase()

    // Crear el grupo
    const result = await query("INSERT INTO `groups` (name, invitation_code, created_at) VALUES (?, ?, NOW())", [
      name,
      invitationCode,
    ])

    const groupId = result.insertId

    // Asignar el usuario al grupo y hacerlo administrador
    await query("UPDATE users SET group_id = ?, is_admin = 1 WHERE id = ?", [groupId, userId])

    return NextResponse.json({
      id: groupId,
      name,
      code: invitationCode,
    })
  } catch (error) {
    console.error("Error al crear grupo:", error)
    return NextResponse.json({ error: "Error al crear grupo" }, { status: 500 })
  }
}
