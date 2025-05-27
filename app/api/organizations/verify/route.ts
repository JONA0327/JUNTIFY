import { type NextRequest, NextResponse } from "next/server"
import { organizationService } from "@/services/organizationService"

// Endpoint para verificar un código de organización
export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ error: "Se requiere código de organización" }, { status: 400 })
    }

    const organization = await organizationService.getOrganizationByCode(code)

    if (!organization) {
      return NextResponse.json({ error: "Código de organización inválido" }, { status: 404 })
    }

    return NextResponse.json(organization)
  } catch (error) {
    console.error("Error al verificar código de organización:", error)
    return NextResponse.json({ error: "Error al verificar código de organización" }, { status: 500 })
  }
}
