import { type NextRequest, NextResponse } from "next/server"
import { organizationService } from "@/services/organizationService"
import { queryOne } from "@/utils/mysql"

// Endpoint para eliminar un miembro de una organización
export async function DELETE(request: NextRequest, { params }: { params: { id: string; userId: string } }) {
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

    // Si el usuario intenta eliminarse a sí mismo, permitirlo
    if (requestingUser.id === userId) {
      const success = await organizationService.removeUserFromOrganization(userId)

      if (!success) {
        return NextResponse.json({ error: "Error al abandonar la organización" }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    // Si intenta eliminar a otro, verificar que sea administrador
    if (!requestingUser.is_admin) {
      return NextResponse.json({ error: "No tienes permisos para eliminar miembros" }, { status: 403 })
    }

    // Verificar que el usuario a eliminar pertenece a la organización
    const targetUser = await queryOne("SELECT organization_id FROM users WHERE id = ?", [userId])

    if (!targetUser || targetUser.organization_id !== organizationId) {
      return NextResponse.json({ error: "El usuario no pertenece a esta organización" }, { status: 404 })
    }

    // Eliminar al usuario de la organización
    const success = await organizationService.removeUserFromOrganization(userId)

    if (!success) {
      return NextResponse.json({ error: "Error al eliminar al miembro" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al eliminar miembro:", error)
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 })
  }
}
