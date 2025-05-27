import { type NextRequest, NextResponse } from "next/server"
import { queryOne } from "@/utils/mysql"

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ error: "Se requiere un código de invitación" }, { status: 400 })
    }

    // Buscar el grupo por código de invitación
    const group = await queryOne("SELECT id, name FROM `groups` WHERE invitation_code = ?", [code])

    if (!group) {
      return NextResponse.json({ error: "Código de invitación inválido" }, { status: 404 })
    }

    return NextResponse.json(group)
  } catch (error) {
    console.error("Error al verificar código de invitación:", error)
    return NextResponse.json({ error: "Error al verificar código de invitación" }, { status: 500 })
  }
}
