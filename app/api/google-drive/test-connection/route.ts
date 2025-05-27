import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { createGoogleDriveService } from "@/utils/google-drive-service"

export async function GET(request: Request) {
  try {
    // Verificar que el usuario tenga permisos para acceder a esta información
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar si las credenciales están configuradas
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      return NextResponse.json({ error: "Las credenciales de Google Drive no están configuradas" }, { status: 400 })
    }

    // Intentar crear el servicio de Google Drive
    let driveService
    try {
      driveService = createGoogleDriveService()
    } catch (error) {
      return NextResponse.json(
        {
          error: "Error al inicializar el servicio de Google Drive: " + (error.message || "Error desconocido"),
          credentials: {
            clientEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
            privateKey: !!process.env.GOOGLE_PRIVATE_KEY,
            folderId: !!process.env.GOOGLE_DRIVE_FOLDER_ID,
          },
        },
        { status: 500 },
      )
    }

    // Intentar listar archivos en la carpeta raíz o en la carpeta especificada
    try {
      const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || "root"
      const files = await driveService.listFiles(folderId)

      // Contamos cuántas carpetas hay
      const folders = files.filter((file) => file.mimeType === "application/vnd.google-apps.folder")

      return NextResponse.json({
        success: true,
        message: "Conexión con Google Drive establecida correctamente",
        fileCount: files.length,
        folderCount: folders.length,
      })
    } catch (error) {
      return NextResponse.json(
        {
          error: "Error al listar archivos de Google Drive: " + (error.message || "Error desconocido"),
          credentials: {
            clientEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
            privateKey: !!process.env.GOOGLE_PRIVATE_KEY,
            folderId: !!process.env.GOOGLE_DRIVE_FOLDER_ID,
          },
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error al probar conexión con Google Drive:", error)
    return NextResponse.json(
      { error: "Error al probar conexión con Google Drive: " + (error.message || "Error desconocido") },
      { status: 500 },
    )
  }
}
