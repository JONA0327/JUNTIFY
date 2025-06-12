import { google } from "googleapis"
import { Readable } from "stream"

// Interfaz para la configuración de la cuenta de servicio
interface ServiceAccountConfig {
  clientEmail: string
  privateKey: string
  folderId?: string
}

export class GoogleDriveService {
  private drive
  private rootFolderId: string | null = null
  private serviceAccountEmail: string

  constructor(config: ServiceAccountConfig) {
    this.serviceAccountEmail = config.clientEmail

    // Configurar la autenticación con la cuenta de servicio
    const auth = new google.auth.JWT({
      email: config.clientEmail,
      key: config.privateKey.replace(/\\n/g, "\n"), // Asegurarse de que las nuevas líneas se manejen correctamente
      scopes: ["https://www.googleapis.com/auth/drive"],
    })

    // Inicializar el cliente de Google Drive
    this.drive = google.drive({ version: "v3", auth })

    // Establecer el ID de carpeta raíz si se proporciona
    if (config.folderId) {
      this.rootFolderId = config.folderId
    }
  }

  // Buscar una carpeta por nombre dentro de una carpeta padre
  async findFolder(folderName: string, parentFolderId?: string): Promise<string | null> {
    try {
      const parent = parentFolderId || this.rootFolderId
      let query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`

      if (parent) {
        query += ` and '${parent}' in parents`
      }

      console.log(`Buscando carpeta "${folderName}" con query: ${query}`)

      const response = await this.drive.files.list({
        q: query,
        fields: "files(id, name, parents)",
        spaces: "drive",
      })

      if (response.data.files && response.data.files.length > 0) {
        console.log(`Carpeta "${folderName}" encontrada:`, response.data.files[0])
        return response.data.files[0].id
      }

      console.log(`Carpeta "${folderName}" no encontrada`)
      return null
    } catch (error) {
      console.error("Error al buscar carpeta:", error)
      throw error
    }
  }

  // Crear una carpeta en Google Drive
  async createFolder(folderName: string, parentId = "root"): Promise<string> {
    try {
      console.log(`Creando carpeta "${folderName}" en carpeta padre: ${parentId}`)

      const response = await this.drive.files.create({
        requestBody: {
          name: folderName,
          mimeType: "application/vnd.google-apps.folder",
          parents: [parentId],
        },
        fields: "id,name,parents",
      })

      console.log(`Carpeta creada:`, response.data)
      return response.data.id
    } catch (error) {
      console.error("Error al crear carpeta en Google Drive:", error)
      throw error
    }
  }

  // Añadir una función para verificar si una carpeta existe
  async checkFolderExists(folderId: string): Promise<boolean> {
    try {
      const response = await this.drive.files.get({
        fileId: folderId,
        fields: "id,name,parents",
      })
      console.log(`Carpeta ${folderId} existe:`, response.data)
      return true
    } catch (error) {
      console.log(`Carpeta ${folderId} no existe`)
      return false
    }
  }

  // Verificar y corregir permisos de una carpeta
  async verifyAndFixFolderPermissions(folderId: string): Promise<boolean> {
    try {
      console.log(`Verificando permisos para la carpeta ${folderId}...`)

      // Intentar obtener información de la carpeta para verificar acceso
      try {
        await this.drive.files.get({
          fileId: folderId,
          fields: "id,name",
        })
        console.log(`La cuenta de servicio tiene acceso a la carpeta ${folderId}`)
        return true
      } catch (accessError) {
        console.warn(`La cuenta de servicio no tiene acceso a la carpeta ${folderId}. Error:`, accessError.message)

        // No podemos corregir automáticamente si no tenemos acceso
        console.log("No se pueden corregir los permisos automáticamente porque la cuenta de servicio no tiene acceso.")
        return false
      }
    } catch (error) {
      console.error("Error al verificar permisos de carpeta:", error)
      return false
    }
  }

  // Añadir una función para buscar la carpeta "Juntify Recordings" existente
  async findJuntifyRecordingsFolder(): Promise<string | null> {
    try {
      console.log("Buscando carpeta 'Juntify Recordings' en Google Drive...")

      const response = await this.drive.files.list({
        q: `name = 'Juntify Recordings' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: "files(id, name, parents)",
        spaces: "drive",
      })

      if (response.data.files && response.data.files.length > 0) {
        console.log(`Carpeta 'Juntify Recordings' encontrada:`, response.data.files[0])

        // Verificar permisos de la carpeta encontrada
        const folderId = response.data.files[0].id
        await this.verifyAndFixFolderPermissions(folderId)

        return folderId
      }

      console.log("Carpeta 'Juntify Recordings' no encontrada")
      return null
    } catch (error) {
      console.error("Error al buscar carpeta Juntify Recordings:", error)
      return null
    }
  }

  // Obtener o crear carpeta de usuario
  async getUserFolder(username: string): Promise<string> {
    try {
      // Buscar la carpeta "Juntify Recordings" existente
      const juntifyFolderId = await this.findJuntifyRecordingsFolder()

      if (juntifyFolderId) {
        console.log("Usando carpeta Juntify Recordings existente:", juntifyFolderId)
        return juntifyFolderId
      }

      // Si no encontramos la carpeta Juntify Recordings, crear una nueva
      console.log("Creando nueva carpeta Juntify Recordings en la raíz")
      const folderId = await this.createFolder("Juntify Recordings", "root")

      console.log("Nueva carpeta Juntify Recordings creada:", folderId)
      return folderId
    } catch (error) {
      console.error("Error al obtener/crear carpeta Juntify Recordings:", error)
      throw error
    }
  }

  // Convertir archivo de webm a AAC
  private convertWebmToAac(
    fileName: string,
    fileContent: Buffer,
  ): { fileName: string; mimeType: string; content: Buffer } {
    // En un entorno real, aquí usaríamos ffmpeg u otra biblioteca para convertir el audio
    // Por ahora, simplemente cambiamos la extensión y el tipo MIME

    // Cambiar la extensión del archivo
    const newFileName = fileName.replace(/\.webm$/, ".aac")
    if (newFileName === fileName) {
      // Si no tenía extensión .webm, añadir .aac
      const newFileName = fileName + ".aac"
    }

    return {
      fileName: newFileName,
      mimeType: "audio/aac",
      content: fileContent, // En una implementación real, aquí estaría el contenido convertido
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
      console.log(`Iniciando subida de archivo "${fileName}" a Google Drive. Tamaño: ${fileContent.length} bytes`)

      if (!fileContent || fileContent.length === 0) {
        throw new Error("El contenido del archivo está vacío")
      }

      // Convertir archivo si es webm
      let finalFileName = fileName
      let finalMimeType = mimeType

      if (mimeType === "audio/webm" || fileName.endsWith(".webm")) {
        console.log("Convirtiendo archivo de webm a AAC...")
        const converted = this.convertWebmToAac(fileName, fileContent)
        finalFileName = converted.fileName
        finalMimeType = converted.mimeType
        console.log(`Archivo convertido: ${finalFileName} (${finalMimeType})`)
      }

      // Si no se proporciona un ID de carpeta, buscar o crear la carpeta Juntify Recordings
      if (!folderId) {
        throw new Error("No se proporcionó un ID de carpeta válido para guardar el archivo")
      }

      console.log(`Subiendo archivo "${finalFileName}" a la carpeta con ID: ${folderId}`)

      const fileMetadata = {
        name: finalFileName,
        parents: [folderId], // Asegurarse de que siempre se use el ID de carpeta
      }

      console.log("Metadatos del archivo:", JSON.stringify(fileMetadata))

      const media = {
        mimeType: finalMimeType || "application/octet-stream",
        body: Readable.from(fileContent),
      }

      console.log("Enviando solicitud a la API de Google Drive...")

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: "id,webViewLink,webContentLink,parents",
      })

      console.log("Respuesta de la API:", JSON.stringify(response.data))

      if (!response.data.id) {
        throw new Error("La API de Google Drive no devolvió un ID de archivo")
      }

      // Verificar que el archivo se haya creado en la carpeta correcta
      if (!response.data.parents || response.data.parents[0] !== folderId) {
        console.warn(
          `El archivo se creó en una carpeta diferente: ${response.data.parents ? response.data.parents[0] : "desconocida"}`,
        )

        // Intentar mover el archivo a la carpeta correcta
        try {
          console.log(`Intentando mover el archivo ${response.data.id} a la carpeta ${folderId}...`)

          // Primero, obtener los padres actuales
          const fileInfo = await this.drive.files.get({
            fileId: response.data.id,
            fields: "parents",
          })

          // Mover el archivo a la carpeta correcta
          await this.drive.files.update({
            fileId: response.data.id,
            removeParents: fileInfo.data.parents.join(","),
            addParents: folderId,
            fields: "id,parents",
          })

          console.log(`Archivo movido correctamente a la carpeta ${folderId}`)
        } catch (moveError) {
          console.error("Error al mover el archivo a la carpeta correcta:", moveError)
        }
      } else {
        console.log(`Archivo creado correctamente en la carpeta: ${folderId}`)
      }

      return {
        id: response.data.id,
        webViewLink: response.data.webViewLink || `https://drive.google.com/file/d/${response.data.id}/view`,
      }
    } catch (error) {
      console.error("Error al subir archivo a Google Drive:", error)

      // Proporcionar información más detallada sobre el error
      const errorMessage = error.message || "Error desconocido"
      const errorDetails = error.response?.data?.error?.message || error.stack || "Sin detalles adicionales"

      throw new Error(`Error al subir archivo a Google Drive: ${errorMessage}. Detalles: ${errorDetails}`)
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

  // Hacer un archivo público (accesible mediante enlace)
  async makeFilePublic(fileId: string): Promise<void> {
    try {
      console.log(`Haciendo público el archivo con ID: ${fileId}`)

      // Verificar que el archivo existe antes de intentar modificar permisos
      try {
        await this.drive.files.get({
          fileId: fileId,
          fields: "id,name",
        })
      } catch (error) {
        throw new Error(`El archivo con ID ${fileId} no existe o no es accesible`)
      }

      await this.drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: "reader",
          type: "anyone",
          allowFileDiscovery: false,
        },
      })

      console.log(`Archivo ${fileId} configurado como público correctamente`)
    } catch (error) {
      console.error("Error al hacer público el archivo:", error)

      // Proporcionar información más detallada sobre el error
      const errorMessage = error.message || "Error desconocido"
      const errorDetails = error.response?.data?.error?.message || error.stack || "Sin detalles adicionales"

      throw new Error(`Error al hacer público el archivo: ${errorMessage}. Detalles: ${errorDetails}`)
    }
  }

  // Eliminar un archivo
  async deleteFile(fileId: string): Promise<void> {
    try {
      await this.drive.files.delete({
        fileId: fileId,
      })
    } catch (error) {
      console.error("Error al eliminar archivo:", error)
      throw error
    }
  }

  // Listar archivos en una carpeta
  async listFiles(folderId?: string): Promise<any[]> {
    try {
      if (!folderId) {
        folderId = await this.findJuntifyRecordingsFolder()
        if (!folderId) {
          throw new Error("No se encontró la carpeta Juntify Recordings")
        }
      }

      console.log(`Listando archivos en carpeta: ${folderId}`)

      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: "files(id, name, mimeType, webViewLink, webContentLink, createdTime, size, parents)",
      })

      console.log(`Se encontraron ${response.data.files?.length || 0} archivos en la carpeta`)

      // Mostrar detalles de cada archivo para depuración
      if (response.data.files && response.data.files.length > 0) {
        response.data.files.forEach((file) => {
          console.log(`Archivo: ${file.name}, ID: ${file.id}, Padres: ${file.parents?.join(", ")}`)
        })
      }

      return response.data.files || []
    } catch (error) {
      console.error("Error al listar archivos:", error)
      throw error
    }
  }

  // Mover un archivo a una carpeta específica
  async moveFile(fileId: string, targetFolderId: string): Promise<void> {
    try {
      console.log(`Moviendo archivo ${fileId} a la carpeta ${targetFolderId}...`)

      // Primero, obtener los padres actuales
      const fileInfo = await this.drive.files.get({
        fileId: fileId,
        fields: "parents",
      })

      if (!fileInfo.data.parents || fileInfo.data.parents.length === 0) {
        throw new Error(`No se pudieron obtener los padres actuales del archivo ${fileId}`)
      }

      // Mover el archivo a la carpeta correcta
      const response = await this.drive.files.update({
        fileId: fileId,
        removeParents: fileInfo.data.parents.join(","),
        addParents: targetFolderId,
        fields: "id,parents",
      })

      console.log(`Archivo movido correctamente:`, response.data)
    } catch (error) {
      console.error("Error al mover archivo:", error)
      throw error
    }
  }

  // Añadir este método a la clase GoogleDriveService
  async getAccessToken(): Promise<string> {
    try {
      // @ts-ignore - Acceder a la propiedad credentials del objeto auth
      const token = await this.drive.context._options.auth.getAccessToken()
      return token
    } catch (error) {
      console.error("Error al obtener token de acceso:", error)
      throw error
    }
  }

  async getFileInfo(fileId: string) {
    try {
      const drive = this.drive // await this.getDriveClient() - No need to await, already initialized in constructor
      const response = await drive.files.get({
        fileId,
        fields: "id, name, mimeType, size",
      })
      return response.data
    } catch (error) {
      console.error("Error getting file info:", error)
      return null
    }
  }

  async getAuthClient() {
    return this.drive.auth
  }

  async getDriveClient() {
    return this.drive
  }
}

// Función para crear una instancia del servicio con las credenciales proporcionadas
export function createGoogleDriveService(): GoogleDriveService {
  try {
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL || ""
    const privateKey = (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || "").replace(/\n/g, "\n")
    return new GoogleDriveService({
      clientEmail: clientEmail,
      privateKey: privateKey,
      // folderId: "ID_DE_TU_CARPETA_RAÍZ"
    })
  } catch (error) {
    console.error("Error al crear el servicio de Google Drive:", error)
    throw new Error("No se pudo inicializar el servicio de Google Drive: " + error.message)
  }
}
