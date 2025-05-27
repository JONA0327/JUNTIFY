import { google } from "googleapis"
import { query } from "@/utils/mysql"
import { Readable } from "stream"

// Configuración para la API de Google Drive
const SCOPES = ["https://www.googleapis.com/auth/drive.file"]

// Credenciales actualizadas (SOLO PARA PRUEBAS)
const HARDCODED_CREDENTIALS = {
  client_id: "632914395060-1bbtbbis41qb65ac4fpbut7js05s95ch.apps.googleusercontent.com",
  client_secret: "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",
  redirect_uri: "https://juntify.com/api/auth/google/callback",
  project_id: "numeric-replica-450010-h9",
  client_email: "juntify@numeric-replica-450010-h9.iam.gserviceaccount.com",
}

// Credenciales para la API de Google
interface GoogleCredentials {
  client_id: string
  client_secret: string
  redirect_uri: string
  api_key?: string
  project_id?: string
  client_email?: string
}

// Clase para manejar la integración con Google Drive
export class GoogleDriveService {
  private oauth2Client
  private drive
  private folderId: string | null = null

  constructor(credentials: GoogleCredentials) {
    console.log("Inicializando GoogleDriveService con credenciales:", {
      client_id: credentials.client_id.substring(0, 10) + "...",
      redirect_uri: credentials.redirect_uri,
      project_id: credentials.project_id || "No configurado",
      client_email: credentials.client_email || "No configurado",
    })

    this.oauth2Client = new google.auth.OAuth2(
      credentials.client_id,
      credentials.client_secret,
      credentials.redirect_uri,
    )

    this.drive = google.drive({
      version: "v3",
      auth: this.oauth2Client,
    })
  }

  // Generar URL para autenticación
  generateAuthUrl(username?: string): string {
    try {
      const url = this.oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES,
        prompt: "consent",
        state: username || undefined, // Pasar el nombre de usuario como estado
      })
      console.log("URL de autenticación generada:", url)
      return url
    } catch (error) {
      console.error("Error al generar URL de autenticación:", error)
      throw error
    }
  }

  // Establecer token de acceso
  setCredentials(tokens: any): void {
    this.oauth2Client.setCredentials(tokens)
  }

  // Obtener tokens con el código de autorización
  async getTokens(code: string): Promise<any> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code)
      this.oauth2Client.setCredentials(tokens)
      return tokens
    } catch (error) {
      console.error("Error al obtener tokens:", error)
      throw error
    }
  }

  // Crear una carpeta en Google Drive
  async createFolder(folderName: string): Promise<string> {
    try {
      const response = await this.drive.files.create({
        requestBody: {
          name: folderName,
          mimeType: "application/vnd.google-apps.folder",
        },
        fields: "id",
      })

      this.folderId = response.data.id
      return response.data.id
    } catch (error) {
      console.error("Error al crear carpeta en Google Drive:", error)
      throw error
    }
  }

  // Crear una carpeta oculta en Google Drive
  async createHiddenFolder(folderName: string): Promise<string> {
    try {
      const response = await this.drive.files.create({
        requestBody: {
          name: folderName,
          mimeType: "application/vnd.google-apps.folder",
          // Propiedades para "ocultar" la carpeta (no aparecerá en "Mi unidad" por defecto)
          parents: ["root"],
          appProperties: {
            hidden: "true",
          },
        },
        fields: "id",
      })

      // Configurar permisos para que solo el propietario pueda acceder
      await this.drive.permissions.create({
        fileId: response.data.id,
        requestBody: {
          role: "owner",
          type: "user",
          emailAddress: "juntify@numeric-replica-450010-h9.iam.gserviceaccount.com", // El correo del propietario
        },
      })

      return response.data.id
    } catch (error) {
      console.error("Error al crear carpeta oculta en Google Drive:", error)
      throw error
    }
  }

  // Hacer un archivo público
  async makeFilePublic(fileId: string): Promise<void> {
    try {
      await this.drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: "reader",
          type: "anyone",
          withLink: true,
        },
      })
    } catch (error) {
      console.error("Error al hacer público el archivo:", error)
      throw error
    }
  }

  // Obtener o crear carpeta del usuario
  async getUserFolder(username: string): Promise<string> {
    try {
      // Buscar si ya existe una carpeta para el usuario
      const response = await this.drive.files.list({
        q: `name = '${username}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: "files(id, name)",
        spaces: "drive",
      })

      if (response.data.files && response.data.files.length > 0) {
        return response.data.files[0].id
      }

      // Si no existe, crear una nueva carpeta
      return await this.createFolder(username)
    } catch (error) {
      console.error("Error al obtener/crear carpeta del usuario:", error)
      throw error
    }
  }

  // Subir un archivo a Google Drive
  async uploadFile(
    fileName: string,
    mimeType: string,
    fileContent: Buffer,
    folderId?: string,
  ): Promise<{ id: string; webViewLink: string }> {
    try {
      const targetFolderId = folderId || this.folderId

      const fileMetadata = {
        name: fileName,
        ...(targetFolderId && { parents: [targetFolderId] }),
      }

      const media = {
        mimeType: mimeType,
        body: Readable.from(fileContent),
      }

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: "id,webViewLink",
      })

      return {
        id: response.data.id,
        webViewLink: response.data.webViewLink,
      }
    } catch (error) {
      console.error("Error al subir archivo a Google Drive:", error)
      throw error
    }
  }

  // Obtener un archivo de Google Drive
  async getFile(fileId: string): Promise<any> {
    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        alt: "media",
      })

      return response.data
    } catch (error) {
      console.error("Error al obtener archivo de Google Drive:", error)
      throw error
    }
  }

  // Obtener enlace de descarga
  async getDownloadLink(fileId: string): Promise<string> {
    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        fields: "webContentLink",
      })

      return response.data.webContentLink
    } catch (error) {
      console.error("Error al obtener enlace de descarga:", error)
      throw error
    }
  }
}

// Función para crear una instancia del servicio
export function createGoogleDriveService(): GoogleDriveService {
  // Usar credenciales hardcodeadas directamente del JSON proporcionado
  const credentials = {
    client_id: "632914395060-1bbtbbis41qb65ac4fpbut7js05s95ch.apps.googleusercontent.com",
    client_secret: "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",
    redirect_uri: "https://juntify.com/api/auth/google/callback",
    project_id: "numeric-replica-450010-h9",
    client_email: "juntify@numeric-replica-450010-h9.iam.gserviceaccount.com",
  }

  return new GoogleDriveService(credentials)
}

// Función para obtener el cliente de Google Drive
export async function getGoogleDriveClient(username: string) {
  try {
    // Obtener los tokens del usuario
    const tokensResult = await query("SELECT access_token, refresh_token FROM google_tokens WHERE username = ?", [
      username,
    ])

    if (!tokensResult || tokensResult.length === 0 || !tokensResult[0].access_token) {
      throw new Error("No se encontraron tokens válidos para el usuario")
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
    return google.drive({ version: "v3", auth: oauth2Client })
  } catch (error) {
    console.error("Error al obtener el cliente de Google Drive:", error)
    throw error
  }
}
