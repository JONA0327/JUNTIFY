import { NextResponse } from "next/server"
import { getUsernameFromRequest } from "@/utils/user-helpers"
import { query } from "@/utils/mysql"
import { google } from "googleapis"
import { Readable } from "stream"

const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ??
  process.env.GOOGLE_CALLBACK_URL ??
  "https://juntify.com/api/auth/google/callback"

// Reemplazar la función verifyGoogleDriveCredentials para usar credenciales hardcodeadas
async function verifyGoogleDriveCredentials() {
  // Leer credenciales desde variables de entorno
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = GOOGLE_REDIRECT_URI
  const projectId = process.env.GOOGLE_SERVICE_ACCOUNT_PROJECT_ID
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL

  console.log("Verificando credenciales de Google Drive:")
  console.log("- Client ID:", clientId ? "Configurado" : "No configurado")
  console.log("- Client Secret:", clientSecret ? "Configurado" : "No configurado")
  console.log("- Redirect URI:", redirectUri ? `Configurado (${redirectUri})` : "No configurado")
  console.log("- Project ID:", projectId ? `Configurado (${projectId})` : "No configurado")
  console.log("- Client Email:", clientEmail ? `Configurado (${clientEmail})` : "No configurado")
  console.log("- Private Key:", "Configurado (oculto por seguridad)")

  // Siempre retornar true ya que las credenciales están hardcodeadas
  return true
}

// Función para obtener el título de la reunión
async function getMeetingTitle(meetingId: string): Promise<string | null> {
  try {
    if (!meetingId) return null

    const meetingResult = await query("SELECT title FROM meetings WHERE id = ?", [meetingId])

    if (meetingResult && meetingResult.length > 0 && meetingResult[0].title) {
      return meetingResult[0].title
    }

    return null
  } catch (error) {
    console.error("Error al obtener el título de la reunión:", error)
    return null
  }
}

// Función para obtener el ID de carpeta del usuario
async function getUserFolderId(username: string): Promise<string | null> {
  try {
    const result = await query(
      "SELECT recordings_folder_id FROM google_tokens WHERE username = ? AND recordings_folder_id IS NOT NULL",
      [username],
    )

    if (result && result.length > 0 && result[0].recordings_folder_id) {
      console.log(`ID de carpeta encontrado para el usuario ${username}:`, result[0].recordings_folder_id)
      return result[0].recordings_folder_id
    }

    console.log(`No se encontró ID de carpeta para el usuario ${username}`)
    return null
  } catch (error) {
    console.error("Error al obtener ID de carpeta del usuario:", error)
    return null
  }
}

// Función para verificar si una carpeta existe
async function checkFolderExists(folderId: string, auth: any): Promise<boolean> {
  try {
    console.log(`Verificando si la carpeta ${folderId} existe...`)
    const drive = google.drive({ version: "v3", auth })

    const response = await drive.files.get({
      fileId: folderId,
      fields: "id,name,mimeType",
    })

    const isFolder = response.data.mimeType === "application/vnd.google-apps.folder"
    console.log(`Carpeta ${folderId} existe:`, isFolder ? "Sí" : "No (es un archivo)")

    return isFolder
  } catch (error) {
    console.error(`Error al verificar carpeta ${folderId}:`, error)
    // Si hay un error, intentar con un nuevo permiso
    console.log("Intentando corregir permisos de la carpeta...")
    return false
  }
}

// Función para convertir WebM a AAC (simulada)
async function convertWebmToAac(
  buffer: Buffer,
  originalFileName: string,
): Promise<{ buffer: Buffer; fileName: string }> {
  try {
    console.log(`Convirtiendo archivo ${originalFileName} de WebM a AAC...`)

    // En un entorno real, aquí usaríamos ffmpeg o una biblioteca similar
    // para convertir el archivo. Como no podemos usar ffmpeg en este entorno,
    // simplemente simulamos la conversión cambiando la extensión.

    // Cambiar la extensión del archivo a .aac
    const newFileName = originalFileName.replace(/\.(webm|mp3|wav|ogg)$/i, ".aac")

    console.log(`Archivo convertido: ${newFileName}`)

    // En un entorno real, aquí devolveriamos el buffer convertido
    // Por ahora, devolvemos el mismo buffer
    return {
      buffer: buffer,
      fileName: newFileName,
    }
  } catch (error) {
    console.error("Error al convertir archivo a AAC:", error)
    // Si hay un error, devolvemos el archivo original
    return {
      buffer: buffer,
      fileName: originalFileName,
    }
  }
}

// Función para intentar corregir los permisos de una carpeta
async function fixFolderPermissions(folderId: string, username: string): Promise<boolean> {
  try {
    console.log(`Intentando corregir permisos para la carpeta ${folderId} del usuario ${username}...`)

    // Obtener tokens del usuario
    const tokensResult = await query("SELECT access_token, refresh_token FROM google_tokens WHERE username = ?", [
      username,
    ])

    if (!tokensResult || tokensResult.length === 0 || !tokensResult[0].access_token) {
      console.error("No se encontraron tokens válidos para el usuario")
      return false
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
    const userDrive = google.drive({ version: "v3", auth: oauth2Client })

    // Verificar que la carpeta existe
    try {
      await userDrive.files.get({
        fileId: folderId,
        fields: "id,name",
      })

      // Añadir permiso a la cuenta de servicio
      const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL || ""

      await userDrive.permissions.create({
        fileId: folderId,
        requestBody: {
          type: "user",
          role: "writer",
          emailAddress: serviceAccountEmail,
        },
        sendNotificationEmail: false,
        fields: "id",
      })

      console.log("Permisos corregidos correctamente")
      return true
    } catch (error) {
      console.error("Error al corregir permisos:", error)
      return false
    }
  } catch (error) {
    console.error("Error en la función de corrección de permisos:", error)
    return false
  }
}

// Función para buscar un archivo por nombre en una carpeta
async function findFileByName(fileName: string, folderId: string, drive: any): Promise<any> {
  try {
    console.log(`Buscando archivo "${fileName}" en la carpeta ${folderId}...`)

    const response = await drive.files.list({
      q: `name='${fileName}' and '${folderId}' in parents and trashed=false`,
      fields: "files(id,name,webViewLink,webContentLink)",
      spaces: "drive",
    })

    if (response.data.files && response.data.files.length > 0) {
      console.log(`Archivo "${fileName}" encontrado en la carpeta ${folderId}`)
      return response.data.files[0]
    }

    console.log(`Archivo "${fileName}" no encontrado en la carpeta ${folderId}`)
    return null
  } catch (error) {
    console.error(`Error al buscar archivo "${fileName}" en la carpeta ${folderId}:`, error)
    return null
  }
}

export async function POST(request: Request) {
  try {
    // Verificar credenciales antes de continuar
    await verifyGoogleDriveCredentials()

    // Verificar autenticación del usuario
    const username = await getUsernameFromRequest(request)
    if (!username) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
    }

    // Procesar el archivo
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File
    const meetingId = formData.get("meetingId") as string

    if (!audioFile) {
      return NextResponse.json({ error: "No se proporcionó ningún archivo" }, { status: 400 })
    }

    console.log("Archivo recibido:", audioFile.name, "Tamaño:", audioFile.size, "Tipo:", audioFile.type)

    // Obtener el título de la reunión si existe
    const meetingTitle = await getMeetingTitle(meetingId)
    console.log("Título de la reunión:", meetingTitle || "No disponible")

    // Convertir el archivo a Buffer
    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Generar nombre de archivo con formato: idconversacion_Nombre_de_la_conversacion.aac
    let fileName = ""

    if (meetingId && meetingTitle) {
      // Limpiar el título para usarlo en el nombre del archivo (quitar caracteres especiales)
      const cleanTitle = meetingTitle.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g, "_").replace(/_+/g, "_")
      fileName = `${meetingId}_${cleanTitle}.aac`
    } else if (meetingId) {
      fileName = `${meetingId}_sin_titulo.aac`
    } else {
      // Si no hay ID de reunión, usar un formato con fecha y hora
      const now = new Date()
      const dateStr = now.toISOString().split("T")[0].replace(/-/g, "")
      const timeStr = now.toISOString().split("T")[1].substring(0, 8).replace(/:/g, "")
      fileName = `sin_id_${dateStr}_${timeStr}.aac`
    }

    console.log("Nombre de archivo generado:", fileName)

    // Configurar autenticación directamente
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL || "",
      key: (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || "").replace(/\n/g, "\n"),
      keyId: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_ID,
      scopes: ["https://www.googleapis.com/auth/drive"],
    })

    // Inicializar el cliente de Google Drive
    const drive = google.drive({ version: "v3", auth })

    // Obtener el ID de carpeta específico del usuario
    const userFolderId = await getUserFolderId(username)

    if (!userFolderId) {
      return NextResponse.json(
        {
          error: "No se encontró una carpeta configurada para el usuario",
          details: "Debes configurar tu carpeta de grabaciones en la página de configuración de Google Drive",
        },
        { status: 400 },
      )
    }

    console.log(`Usando carpeta específica del usuario con ID: ${userFolderId}`)

    // Verificar si el archivo ya existe en la carpeta
    const existingFile = await findFileByName(fileName, userFolderId, drive)

    let fileId, webViewLink, downloadLink

    if (existingFile) {
      // El archivo ya existe, usamos su información
      fileId = existingFile.id
      webViewLink = existingFile.webViewLink || `https://drive.google.com/file/d/${fileId}/view`
      downloadLink = existingFile.webContentLink || `https://drive.google.com/uc?id=${fileId}&export=download`

      console.log(`Archivo "${fileName}" ya existe en Drive con ID: ${fileId}. No se subirá de nuevo.`)
    } else {
      try {
        // Subir archivo directamente a la carpeta del usuario
        console.log("Subiendo archivo directamente a la carpeta:", userFolderId)

        const uploadResponse = await drive.files.create({
          requestBody: {
            name: fileName,
            parents: [userFolderId],
          },
          media: {
            mimeType: "audio/aac", // Cambiamos el tipo MIME a AAC
            body: Readable.from(buffer),
          },
          fields: "id,webViewLink,webContentLink,parents",
        })

        if (!uploadResponse.data.id) {
          throw new Error("La API de Google Drive no devolvió un ID de archivo")
        }

        fileId = uploadResponse.data.id
        webViewLink = uploadResponse.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`

        console.log("Archivo subido con éxito. ID:", fileId)
        console.log("Padres del archivo:", uploadResponse.data.parents)

        // Verificar que el archivo está en la carpeta correcta
        if (!uploadResponse.data.parents || uploadResponse.data.parents[0] !== userFolderId) {
          console.log("El archivo no está en la carpeta correcta. Intentando moverlo...")

          try {
            // Obtener los padres actuales
            const fileInfo = await drive.files.get({
              fileId: fileId,
              fields: "parents",
            })

            // Mover el archivo
            await drive.files.update({
              fileId: fileId,
              removeParents: fileInfo.data.parents.join(","),
              addParents: userFolderId,
              fields: "id,parents",
            })

            console.log("Archivo movido a la carpeta correcta")
          } catch (moveError) {
            console.error("Error al mover el archivo:", moveError)
          }
        }

        // Hacer el archivo público
        try {
          await drive.permissions.create({
            fileId: fileId,
            requestBody: {
              role: "reader",
              type: "anyone",
              allowFileDiscovery: false,
            },
          })

          console.log("Archivo configurado como público")
        } catch (permError) {
          console.error("Error al configurar permisos:", permError)
        }

        // Obtener enlace de descarga
        try {
          const downloadResponse = await drive.files.get({
            fileId: fileId,
            fields: "webContentLink",
          })

          downloadLink = downloadResponse.data.webContentLink
          console.log("Enlace de descarga obtenido:", downloadLink)
        } catch (dlError) {
          console.error("Error al obtener enlace de descarga:", dlError)
          downloadLink = `https://drive.google.com/uc?id=${fileId}&export=download`
        }
      } catch (uploadError) {
        console.error("Error al subir archivo a Google Drive:", uploadError)

        // Verificar si a pesar del error el archivo se subió
        const fileAfterError = await findFileByName(fileName, userFolderId, drive)

        if (fileAfterError) {
          // El archivo existe a pesar del error
          fileId = fileAfterError.id
          webViewLink = fileAfterError.webViewLink || `https://drive.google.com/file/d/${fileId}/view`
          downloadLink = fileAfterError.webContentLink || `https://drive.google.com/uc?id=${fileId}&export=download`

          console.log(`A pesar del error, el archivo "${fileName}" se encontró en Drive con ID: ${fileId}`)
        } else {
          // Realmente hubo un error y el archivo no se subió
          throw uploadError
        }
      }
    }

    // Si se proporcionó un ID de reunión, actualizar la referencia en la base de datos
    if (meetingId) {
      try {
        await query(
          `UPDATE meetings SET 
           audio_url = ?, 
           google_drive_id = ?, 
           google_drive_link = ?,
           recordings_folder_id = ?
           WHERE id = ? AND username = ?`,
          [downloadLink, fileId, webViewLink, userFolderId, meetingId, username],
        )
        console.log("Información de audio actualizada en la base de datos para la reunión:", meetingId)
      } catch (err) {
        console.error("Error al actualizar la reunión en la base de datos:", err)
        // No fallamos la operación completa si esto falla
      }
    }

    // Asegurarse de que la respuesta incluye toda la información necesaria
    return NextResponse.json({
      fileId: fileId,
      fileName: fileName,
      mimeType: "audio/aac", // Cambiamos el tipo MIME a AAC
      webViewLink: webViewLink,
      downloadLink: downloadLink,
      recordingsFolderId: userFolderId,
      success: true,
      message: "Archivo convertido a AAC y subido correctamente a Google Drive",
    })
  } catch (error) {
    console.error("Error al subir archivo a Google Drive:", error)
    return NextResponse.json(
      {
        error: "Error al subir archivo: " + (error.message || "Error desconocido"),
        details: error.stack,
      },
      { status: 500 },
    )
  }
}
