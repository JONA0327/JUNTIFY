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
      email: "juntify@numeric-replica-450010-h9.iam.gserviceaccount.com",
      key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC3fJ1n1m1aE+ZA\ncRwFjbEgm8tx5pZW8DP2jWoCnF/VhakfSzvKEOI0r/VjtuHdVlWV21r2OPD34D5N\nqeztEkJnqiZObJHOQXtc6/XSaNwXVPTxXpSieyjRX8UhouUtpZRP0GcW7+Q3VQ/Z\nDzsK19I6HeFeo4/s8vIqrOwUBKrkXeSv3iFsF1bbBpSwL0razboEk8va0byRs7Tw\no/eK1TeGufetSDSkDkWwXTfz55lOAoiFeknfnQIEAgFkFFQrIv/dpaEIbE7zJ/iO\nWPeF7CtCL3fzeVKpEmOYn7zyy4lqP/LIjYQb4LVvd1bwzrgT5vBaY/EZMyPZL2nN\nfYLD+7/nAgMBAAECggEAAmz7HBA0RTUesDCJdJLS2ph9cr1wcm7JL0VbbQ0vLg7+\ncivusJhjrKmj0Sjlo7370VDKoeGM/dmom8fhhcqPgXADXcqqAS+cAsDoaHO3PYuH\ntSD8mPx2ci5JP6QW91ANeaZjdLNAs55/7LNA3L8LYtDy297OjvyUE0xCGV35EyqG\nvUcyzIrwpBg+LfxmNtdXlupP07bUMlLwPNtBiL9RpMEU5ZZq9Q4op134C58kF+Vf\n+RjxtJDxIk/Q0C9keaW8wnIlKn69AI8DhAqEcM94/sPR3Ib5Ni6GzdhIE20Bt9hO\nOw8zRnki2QTtT9d7QSCKDLGxePJUTrGp6K8dnn5JqQKBgQDjKWfsvwR+8djCgPgT\nPL59VkY89VBtJI09pL/onhdZ7kqRN0cSSb/ELgrCBHz1L7sPi1Hr0QA9u7UZR5b/\nuyjJMKAhl2PS8zlJLwcugoabTyQWuCvNF4mKrQmvxN6NuobdnpkBeRQODhISjnDD\ndnMgPppGzDDYjb8rs7iDm888yQKBgQDOx83Fp3cZESee7GpHqzXl35+5S06jkU0c\nrgTRGSATjONUTlZCroousASGMWK/W5Ngb+jevh+hn2YzFJ4m0B2H/J9vfzTBAV8l\n9K1BFX5y+aIHmHlEZPPO+pUWoWhxtJ/pYNVrglLLgZ8GbAknkQ0PPN3Hnv62JQpC\nWpEDY9lfLwKBgQCuG9NawsG4ZreDxQPfAsTiHhkxqbieHtDeuYKZ0WoGdLzUdrDT\nlJEV1VBLitMXviC69kaw3v03U8KngJZ8pb/KDKn/dSB+1AtJS3FOtZ5kNZFslHaF\n+I9kKeJtxQ/rQ1cRT/joBxxW9XPmoyRMvGHbCgCHWQPrRyGKZnJ69RYu+QKBgQDH\nGc3BNjlP8puiw2KmNW2FNGg34xIKHrsQFWLf7wBasrqlD3Sxahv1Tlhc2aqKNGPY\nZIjmCEyus6uVHZIWLydwK8dcdTBXcrmp80jrNQX3MPRZue9x8n5rWg45pxrI+TFM\nZoe4p9iOyPVVGqtJ5LmdZW7qaeY5fbq+HzQn/nlr0wKBgET6AN2Y/Pa8hxSiCCzb\nUHPOH2MjEY1Qez2VA7zt6P4pYFg1O2gV8EmywM82Jc4r8Z51EJA7ZPcgEcDuDSbw\nzt1k0yFk3Uvph/DSg+xvnNcu+lD67xckEfXAPgsnIk46VbOncecirBTEksurJYHh\ntFbpnxZyELFDD7BuSfAYND6x\n-----END PRIVATE KEY-----\n".replace(
        /\\n/g,
        "\n",
      ),
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
