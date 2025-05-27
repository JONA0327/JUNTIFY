import { NextResponse } from "next/server"
import { google } from "googleapis"
import { query } from "@/utils/mysql"
import { getUsernameFromRequest } from "@/utils/user-helpers"

// Cuenta de servicio de Juntify
const SERVICE_ACCOUNT_EMAIL = "juntify@numeric-replica-450010-h9.iam.gserviceaccount.com"

export async function POST(request: Request) {
  try {
    // Verificar autenticación del usuario
    const username = await getUsernameFromRequest(request)
    if (!username) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
    }

    // Obtener tokens del usuario
    const tokensResult = await query("SELECT access_token, refresh_token FROM google_tokens WHERE username = ?", [
      username,
    ])

    if (!tokensResult || tokensResult.length === 0 || !tokensResult[0].access_token) {
      return NextResponse.json({ error: "No se encontraron tokens válidos para el usuario" }, { status: 400 })
    }

    // Configurar OAuth2 con los tokens del usuario
    const oauth2Client = new google.auth.OAuth2(
      "632914395060-1bbtbbis41qb65ac4fpbut7js05s95ch.apps.googleusercontent.com",
      "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",
      "https://juntify.com/api/auth/google/callback",
    )

    oauth2Client.setCredentials({
      access_token: tokensResult[0].access_token,
      refresh_token: tokensResult[0].refresh_token,
    })

    // Inicializar el cliente de Drive con la cuenta del usuario
    const drive = google.drive({ version: "v3", auth: oauth2Client })

    // Crear carpeta de grabaciones
    const folderName = "Juntify Recordings"
    const folderMetadata = {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
    }

    console.log(`Creando carpeta "${folderName}" para el usuario ${username}...`)

    const folderResponse = await drive.files.create({
      requestBody: folderMetadata,
      fields: "id,name,webViewLink",
    })

    if (!folderResponse.data.id) {
      throw new Error("No se pudo crear la carpeta de grabaciones")
    }

    const folderId = folderResponse.data.id
    console.log(`Carpeta creada con ID: ${folderId}`)

    // Añadir permiso a la cuenta de servicio de Juntify
    console.log(`Añadiendo permiso de editor a la cuenta de servicio ${SERVICE_ACCOUNT_EMAIL}...`)

    await drive.permissions.create({
      fileId: folderId,
      requestBody: {
        type: "user",
        role: "writer",
        emailAddress: SERVICE_ACCOUNT_EMAIL,
      },
      sendNotificationEmail: false,
      fields: "id",
    })

    // Verificar que el permiso se haya añadido correctamente
    const permissions = await drive.permissions.list({
      fileId: folderId,
      fields: "permissions(id,emailAddress,role)",
    })

    console.log("Permisos de la carpeta:", JSON.stringify(permissions.data.permissions))

    const serviceAccountPermission = permissions.data.permissions?.find((p) => p.emailAddress === SERVICE_ACCOUNT_EMAIL)

    if (!serviceAccountPermission) {
      console.warn("¡ADVERTENCIA! No se encontró el permiso de la cuenta de servicio en la lista de permisos")
    } else {
      console.log(`Permiso añadido correctamente con rol: ${serviceAccountPermission.role}`)
    }

    // Guardar el ID de la carpeta en la base de datos
    await query("UPDATE google_tokens SET recordings_folder_id = ? WHERE username = ?", [folderId, username])

    return NextResponse.json({
      success: true,
      folderId: folderId,
      folderName: folderName,
      folderLink: folderResponse.data.webViewLink,
      message: "Carpeta de grabaciones creada correctamente",
    })
  } catch (error) {
    console.error("Error al crear carpeta de grabaciones:", error)
    return NextResponse.json({ error: "Error al crear carpeta de grabaciones: " + error.message }, { status: 500 })
  }
}
