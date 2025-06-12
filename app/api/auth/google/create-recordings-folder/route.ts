import { NextResponse } from "next/server"
import { google } from "googleapis"
import { query } from "@/utils/mysql"
import { getUsernameFromRequest } from "@/utils/user-helpers"

const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ??
  "https://juntify.com/api/auth/google/callback"

// Cuenta de servicio de Juntify
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL || ""

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
      process.env.GOOGLE_CLIENT_ID || "",
      process.env.GOOGLE_CLIENT_SECRET || "",
      GOOGLE_REDIRECT_URI,

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
