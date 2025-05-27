import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(request: Request) {
  try {
    // Verificar que el usuario tenga permisos para acceder a esta información
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // En un entorno real, verificaríamos si el usuario es administrador
    // Por simplicidad, aquí asumimos que cualquier usuario autenticado puede verificar el estado

    // Verificar las variables de entorno
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
    const privateKey = process.env.GOOGLE_PRIVATE_KEY
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID

    return NextResponse.json({
      credentials: {
        clientEmail: !!clientEmail,
        privateKey: !!privateKey,
        folderId: !!folderId,
      },
    })
  } catch (error) {
    console.error("Error al verificar credenciales:", error)
    return NextResponse.json(
      { error: "Error al verificar credenciales: " + (error.message || "Error desconocido") },
      { status: 500 },
    )
  }
}
