import { type NextRequest, NextResponse } from "next/server"
import { organizationService } from "@/services/organizationService"
import { queryOne } from "@/utils/mysql"

// Endpoint para añadir un miembro a una organización
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const organizationId = params.id
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "Se requiere ID de usuario" }, { status: 400 })
    }

    // Verificar que la organización existe
    const organization = await organizationService.getOrganizationById(organizationId)

    if (!organization) {
      return NextResponse.json({ error: "Organización no encontrada" }, { status: 404 })
    }

    // Verificar que el usuario no pertenece ya a una organización
    const user = await queryOne("SELECT organization_id FROM users WHERE id = ?", [userId])

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    if (user.organization_id) {
      return NextResponse.json({ error: "El usuario ya pertenece a una organización" }, { status: 400 })
    }

    // Asignar el usuario a la organización
    const success = await organizationService.assignUserToOrganization(userId, organizationId, false)

    if (!success) {
      return NextResponse.json({ error: "Error al asignar usuario a la organización" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al añadir miembro:", error)
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 })
  }
}
