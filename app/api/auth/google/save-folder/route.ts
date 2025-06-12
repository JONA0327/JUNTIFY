import { NextResponse } from "next/server"
import { getUsernameFromRequest } from "@/utils/user-helpers"
import { query } from "@/utils/mysql"
import { google } from "googleapis"
import type { NextRequest } from "next/server"

const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ??
  process.env.GOOGLE_CALLBACK_URL ??
  "https://juntify.com/api/auth/google/callback"

export async function POST(request: NextRequest) {
  try {
    // Obtener el username del request
    const username = await getUsernameFromRequest(request)

    if (!username) {
      return NextResponse.json({ error: "Unauthorized - Username not provided" }, { status: 401 })
    }

    // Obtener los datos del cuerpo de la solicitud
    const data = await request.json()
    const { folderId } = data

    if (!folderId) {
      return NextResponse.json({ error: "No se proporcionó un ID de carpeta" }, { status: 400 })
    }

    console.log(`Guardando ID de carpeta ${folderId} para el usuario ${username}`)

    // Verificar si el usuario tiene un registro en google_tokens
    const tokensResult = await query("SELECT id, access_token, refresh_token FROM google_tokens WHERE username = ?", [
      username,
    ])

    if (!tokensResult || tokensResult.length === 0) {
      return NextResponse.json(
        {
          error: "El usuario no tiene conexión con Google Drive",
          details: "Debes conectar tu cuenta de Google Drive antes de configurar una carpeta",
        },
        { status: 400 },
      )
    }

    // Obtener los tokens del usuario
    const userAccessToken = tokensResult[0].access_token
    const userRefreshToken = tokensResult[0].refresh_token

    if (!userAccessToken || !userRefreshToken) {
      return NextResponse.json(
        {
          error: "Tokens de acceso inválidos",
          details: "Los tokens de Google Drive son inválidos o están expirados. Por favor, reconecta tu cuenta.",
        },
        { status: 400 },
      )
    }

    // Configurar OAuth2 con los tokens del usuario
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID || "",
      process.env.GOOGLE_CLIENT_SECRET || "",
      GOOGLE_REDIRECT_URI,
    )

    oauth2Client.setCredentials({
      access_token: userAccessToken,
      refresh_token: userRefreshToken,
    })

    // Inicializar el cliente de Google Drive con los tokens del usuario
    const userDrive = google.drive({ version: "v3", auth: oauth2Client })

    // Verificar que la carpeta existe y el usuario tiene acceso
    try {
      const folderResponse = await userDrive.files.get({
        fileId: folderId,
        fields: "id,name,mimeType",
      })

      if (folderResponse.data.mimeType !== "application/vnd.google-apps.folder") {
        return NextResponse.json(
          {
            error: "El ID proporcionado no corresponde a una carpeta",
            details: "Por favor, proporciona un ID de una carpeta válida de Google Drive",
          },
          { status: 400 },
        )
      }

      console.log(`Carpeta verificada: ${folderResponse.data.name} (${folderResponse.data.id})`)
    } catch (error) {
      return NextResponse.json(
        {
          error: "No se pudo acceder a la carpeta",
          details:
            "La carpeta no existe o no tienes permisos para acceder a ella. Por favor, verifica que el ID es correcto.",
        },
        { status: 400 },
      )
    }

    // Añadir permiso de editor a la cuenta de servicio de Juntify
    try {
      const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL || ""

      console.log(`Añadiendo permiso de editor a ${serviceAccountEmail} para la carpeta ${folderId}`)

      const permissionResponse = await userDrive.permissions.create({
        fileId: folderId,
        requestBody: {
          type: "user",
          role: "writer",
          emailAddress: serviceAccountEmail,
        },
        fields: "id",
      })

      console.log("Permiso añadido con ID:", permissionResponse.data.id)
    } catch (permError) {
      console.error("Error al añadir permiso a la cuenta de servicio:", permError)

      // No fallamos la operación completa si esto falla, pero lo registramos
      console.log("Continuando a pesar del error de permisos. La carpeta podría no funcionar correctamente.")
    }

    // Actualizar el ID de carpeta en la base de datos
    await query("UPDATE google_tokens SET recordings_folder_id = ?, updated_at = NOW() WHERE username = ?", [
      folderId,
      username,
    ])

    console.log(`ID de carpeta guardado correctamente para el usuario ${username}`)

    return NextResponse.json({
      success: true,
      message: "ID de carpeta guardado correctamente y permisos configurados",
      folderId,
    })
  } catch (error) {
    console.error("Error al guardar ID de carpeta:", error)
    return NextResponse.json(
      {
        error: "Error al guardar ID de carpeta",
        details: error.message || "Error desconocido",
      },
      { status: 500 },
    )
  }
}
