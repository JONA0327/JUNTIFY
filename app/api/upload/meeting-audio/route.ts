import { NextResponse } from "next/server"
import { getUsernameFromRequest } from "@/utils/user-helpers"
import { Readable } from "stream"
import { google } from "googleapis"
import { query } from "@/utils/mysql"

export async function POST(request: Request) {
  try {
    // Verificar autenticación del usuario
    const username = await getUsernameFromRequest(request)
    if (!username) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
    }

    // Obtener los datos del formulario
    const formData = await request.formData()
    const meetingId = formData.get("meetingId") as string
    const fileName = formData.get("fileName") as string
    const audioFile = formData.get("audio") as File

    if (!meetingId || !audioFile) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }

    console.log(`Subiendo archivo a Google Drive para la reunión ${meetingId} con nombre ${fileName}`)

    // Convertir File a Buffer
    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Configurar autenticación
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL || "",
      key: (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || "").replace(/\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/drive"],
    })

    // Inicializar el cliente de Google Drive
    const drive = google.drive({ version: "v3", auth })

    // Obtener el ID de carpeta del usuario
    const result = await query(
      "SELECT recordings_folder_id FROM google_tokens WHERE username = ? AND recordings_folder_id IS NOT NULL",
      [username],
    )

    if (!result || result.length === 0 || !result[0].recordings_folder_id) {
      return NextResponse.json(
        {
          error: "No se encontró una carpeta configurada para el usuario",
          details: "Debes configurar tu carpeta de grabaciones en la página de configuración de Google Drive",
        },
        { status: 400 },
      )
    }

    const userFolderId = result[0].recordings_folder_id
    console.log(`Usando carpeta específica del usuario con ID: ${userFolderId}`)

    let fileId, webViewLink, downloadLink

    try {
      // Subir archivo directamente a la carpeta del usuario
      const uploadResponse = await drive.files.create({
        requestBody: {
          name: fileName,
          parents: [userFolderId],
        },
        media: {
          mimeType: "audio/aac",
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

      // Hacer el archivo público
      await drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: "reader",
          type: "anyone",
          allowFileDiscovery: false,
        },
      })

      // Obtener enlace de descarga
      const downloadResponse = await drive.files.get({
        fileId: fileId,
        fields: "webContentLink",
      })

      downloadLink = downloadResponse.data.webContentLink || `https://drive.google.com/uc?id=${fileId}&export=download`
    } catch (uploadError) {
      console.error("Error durante la subida a Google Drive:", uploadError)

      // Verificar si el archivo ya existe en Drive a pesar del error
      try {
        // Buscar el archivo por nombre en la carpeta del usuario
        const searchResponse = await drive.files.list({
          q: `name='${fileName}' and '${userFolderId}' in parents and trashed=false`,
          fields: "files(id,name,webViewLink,webContentLink)",
          spaces: "drive",
        })

        if (searchResponse.data.files && searchResponse.data.files.length > 0) {
          // El archivo existe a pesar del error
          const file = searchResponse.data.files[0]
          fileId = file.id
          webViewLink = file.webViewLink || `https://drive.google.com/file/d/${fileId}/view`
          downloadLink = file.webContentLink || `https://drive.google.com/uc?id=${fileId}&export=download`

          console.log("Archivo encontrado a pesar del error. ID:", fileId)
        } else {
          // No se encontró el archivo, reenviar el error original
          throw uploadError
        }
      } catch (searchError) {
        console.error("Error al buscar archivo después de error de subida:", searchError)
        throw uploadError
      }
    }

    // Si llegamos aquí, tenemos un fileId válido (ya sea por subida exitosa o porque encontramos el archivo)

    // Actualizar la reunión con la información de Google Drive
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
    } catch (dbError) {
      console.error("Error al actualizar la reunión en la base de datos:", dbError)
      // No fallamos la operación completa si esto falla, ya que el archivo se subió correctamente
    }

    return NextResponse.json({
      success: true,
      fileId,
      webViewLink,
      downloadLink,
      fileName,
      recordingsFolderId: userFolderId,
    })
  } catch (error) {
    console.error("Error al subir archivo a Google Drive:", error)
    return NextResponse.json(
      {
        error: "Error al subir archivo a Google Drive",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
