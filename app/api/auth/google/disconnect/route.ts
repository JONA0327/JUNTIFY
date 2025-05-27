import { NextResponse } from "next/server"
import { query } from "@/utils/mysql"
import { getUsernameFromRequest } from "@/utils/user-helpers"

export async function POST(request: Request) {
  try {
    const username = await getUsernameFromRequest(request)

    if (!username) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
    }

    // Eliminar tokens de Google Drive
    await query(`DELETE FROM google_tokens WHERE username = ?`, [username])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al desconectar Google Drive:", error)
    return NextResponse.json({ error: "Error al desconectar Google Drive" }, { status: 500 })
  }
}
