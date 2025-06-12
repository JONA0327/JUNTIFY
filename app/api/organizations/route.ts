import { type NextRequest, NextResponse } from "next/server"
import { organizationService } from "@/services/organizationService"
import { query } from "@/lib/db"

// Endpoint para crear una nueva organización
export async function POST(request: NextRequest) {
  try {
    const { userId, name } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "Se requiere ID de usuario" }, { status: 400 })
    }

    // Crear la organización
    const organization = await organizationService.createOrganization(name)

    // Asignar el usuario como administrador
    await organizationService.assignUserToOrganization(userId, organization.id, true)

    return NextResponse.json(organization, { status: 201 })
  } catch (error) {
    console.error("Error al crear organización:", error)
    return NextResponse.json({ error: "Error al crear la organización" }, { status: 500 })
  }
}

// Endpoint para obtener todas las organizaciones (solo para administradores)
export async function GET(request: NextRequest) {
  try {
    const username = request.headers.get("X-Username")
    if (!username) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const user = await query("SELECT is_admin FROM users WHERE username = ? OR email = ?", [username, username])
    if (!user[0] || user[0].is_admin !== 1) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const organizations = await query("SELECT * FROM organizations ORDER BY name")

    return NextResponse.json(organizations)
  } catch (error) {
    console.error("Error al obtener organizaciones:", error)
    return NextResponse.json({ error: "Error al obtener organizaciones" }, { status: 500 })
  }
}
