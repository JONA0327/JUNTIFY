import { NextResponse } from "next/server"
import { getUsernameFromRequest } from "@/utils/user-helpers"
import { query } from "@/utils/mysql"
import { google } from "googleapis"

const GOOGLE_CALLBACK_URL =
  process.env.GOOGLE_CALLBACK_URL ??
  "https://juntify.com/api/auth/google/callback"

export async function POST(request: Request) {
  try {
    // Verificar autenticación del usuario
    const username = await getUsernameFromRequest(request)
    if (!username) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
    }

    // Obtener el nombre de la carpeta del cuerpo de la solicitud
    const body = await request.json()
    const folderName = body.folderName || "Juntify Recordings"

    console.log(`Creando carpeta "${folderName}" para el usuario ${username}...`)

    // Obtener los tokens del usuario
    const tokensResult = await query("SELECT access_token, refresh_token FROM google_tokens WHERE username = ?", [
      username,
    ])

    if (!tokensResult || tokensResult.length === 0) {
      return NextResponse.json(
        {
          error: "El usuario no tiene conexión con Google Drive",
          details: "Debes conectar tu cuenta de Google Drive antes de crear una carpeta",
        },
        { status: 400 },
      )
    }

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
      "632914395060-1bbtbbis41qb65ac4fpbut7js05s95ch.apps.googleusercontent.com",
      "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",
      GOOGLE_CALLBACK_URL,
    )

    oauth2Client.setCredentials({
      access_token: userAccessToken,
      refresh_token: userRefreshToken,
    })

    // Inicializar el cliente de Google Drive con los tokens del usuario
    const userDrive = google.drive({ version: "v3", auth: oauth2Client })

    // Crear la carpeta en Google Drive usando la cuenta del usuario
    const folderResponse = await userDrive.files.create({
      requestBody: {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
        parents: ["root"],
      },
      fields: "id,name,webViewLink",
    })

    if (!folderResponse.data.id) {
      throw new Error("No se pudo crear la carpeta en Google Drive")
    }

    const folderId = folderResponse.data.id
    console.log(`Carpeta creada con ID: ${folderId} a nombre del usuario`)

    // Añadir permiso de editor a la cuenta de servicio de Juntify
    try {
      const serviceAccountEmail = "juntify@numeric-replica-450010-h9.iam.gserviceaccount.com"

      console.log(`Añadiendo permiso de editor a ${serviceAccountEmail} para la carpeta ${folderId}`)

      // Configurar los permisos para la cuenta de servicio
      const permissionResponse = await userDrive.permissions.create({
        fileId: folderId,
        sendNotificationEmail: false, // No enviar notificación por email
        requestBody: {
          type: "user",
          role: "writer", // Rol de editor
          emailAddress: serviceAccountEmail,
          transferOwnership: false,
        },
        fields: "id",
      })

      console.log("Permiso añadido con ID:", permissionResponse.data.id)

      // Verificar que el permiso se haya añadido correctamente
      const permissions = await userDrive.permissions.list({
        fileId: folderId,
        fields: "permissions(id,emailAddress,role)",
      })

      console.log("Permisos actuales de la carpeta:", JSON.stringify(permissions.data.permissions))

      // Verificar si la cuenta de servicio tiene permisos
      const serviceAccountPermission = permissions.data.permissions?.find((p) => p.emailAddress === serviceAccountEmail)

      if (!serviceAccountPermission) {
        console.warn("¡Advertencia! No se encontró el permiso para la cuenta de servicio en la lista de permisos.")
      } else {
        console.log(
          `Permiso verificado para la cuenta de servicio: ${serviceAccountPermission.role} (ID: ${serviceAccountPermission.id})`,
        )
      }
    } catch (permError) {
      console.error("Error al añadir permiso a la cuenta de servicio:", permError)
      console.log("Detalles del error:", JSON.stringify(permError.response?.data || permError.message))

      // No fallamos la operación completa si esto falla, pero lo registramos
      console.log("Continuando a pesar del error de permisos. La carpeta podría no funcionar correctamente.")
    }

    // Guardar el ID de la carpeta en la base de datos
    await query("UPDATE google_tokens SET recordings_folder_id = ? WHERE username = ?", [folderId, username])
    console.log(`ID de carpeta guardado en la base de datos para el usuario ${username}`)

    return NextResponse.json({
      success: true,
      folderId: folderId,
      folderName: folderName,
      webViewLink: folderResponse.data.webViewLink,
      message: `Carpeta "${folderName}" creada correctamente y visible en tu Google Drive`,
    })
  } catch (error) {
    console.error("Error al crear carpeta en Google Drive:", error)
    return NextResponse.json(
      {
        error: "Error al crear carpeta en Google Drive",
        details: error.message || "Error desconocido",
      },
      { status: 500 },
    )
  }
}
