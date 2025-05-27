import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { checkGoogleDriveCredentials } from "@/utils/drive-diagnostic"

export async function GET(request: Request) {
  try {
    // Verificar que el usuario tenga permisos
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Ejecutar diagnóstico
    const diagnosticResult = await checkGoogleDriveCredentials()

    return NextResponse.json({
      success: diagnosticResult.success,
      ...diagnosticResult,
    })
  } catch (error) {
    console.error("Error al ejecutar diagnóstico de Google Drive:", error)
    return NextResponse.json(
      { error: "Error al ejecutar diagnóstico: " + (error.message || "Error desconocido") },
      { status: 500 },
    )
  }
}
