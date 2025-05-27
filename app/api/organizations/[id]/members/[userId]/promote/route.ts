import { type NextRequest, NextResponse } from "next/server"
import { queryOne, query } from "@/utils/mysql"

// Endpoint para promover a un miembro a administrador
export async function PUT(request: NextRequest, { params }: { params: { id: string; userId: string } }) {
  try {
    const organizationId = params.id
    const userId = params.userId
    const username = request.headers.get("X-Username")

    if (!username) {
      return NextResponse.json({ error: "Se requiere nombre de usuario" }, { status: 400 })
    }

    // Verificar que el usuario que hace la solicitud es administrador
    const requestingUser = await queryOne("SELECT id, organization_id, is_admin FROM users WHERE username = ?", [
      username,
    ])

    if (!requestingUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    if (requestingUser.organization_id !== organizationId) {
      return NextResponse.json({ error: "No perteneces a esta organización" }, { status: 403 })
    }

    if (!requestingUser.is_admin) {
      return NextResponse.json({ error: "No tienes permisos para promover miembros" }, { status: 403 })
    }

    // Verificar que el usuario a promover pertenece a la organización
    const targetUser = await queryOne("SELECT organization_id, is_admin FROM users WHERE id = ?", [userId])

    if (!targetUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    if (targetUser.organization_id !== organizationId) {
      return NextResponse.json({ error: "El usuario no pertenece a esta organización" }, { status: 404 })
    }

    if (targetUser.is_admin) {
      return NextResponse.json({ error: "El usuario ya es administrador" }, { status: 400 })
    }

    // Promover al usuario a administrador
    await query("UPDATE users SET is_admin = true WHERE id = ?", [userId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al promover miembro:", error)
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 })
  }
}
