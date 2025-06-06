import { NextResponse } from "next/server"
import { getUsernameFromRequest } from "@/utils/user-helpers"
import { Readable } from "stream"
import { google } from "googleapis"
import { query } from "@/utils/mysql"

// Función para subir archivo a Google Drive
async function uploadToGoogleDrive(
  audioBlob: Blob,
  meetingId: number,
  meetingTitle: string,
  username: string,
): Promise<{ fileId: string; webViewLink: string; downloadLink: string }> {
  try {
    console.log(`Subiendo archivo a Google Drive para la reunión ${meetingId} - ${meetingTitle}`)

    // Convertir Blob a Buffer
    const arrayBuffer = await audioBlob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Generar nombre de archivo con formato: idconversacion_Nombre_de_la_conversacion.aac
    const cleanTitle = meetingTitle.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g, "_").replace(/_+/g, "_")
    const fileName = `${meetingId}_${cleanTitle}.aac`
    console.log("Nombre de archivo generado:", fileName)

    // Configurar autenticación
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_CLIENT_SECRET?.replace(/\\n/g, "\n"),
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
      throw new Error("No se encontró una carpeta configurada para el usuario")
    }

    const userFolderId = result[0].recordings_folder_id
    console.log(`Usando carpeta específica del usuario con ID: ${userFolderId}`)

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

    const fileId = uploadResponse.data.id
    const webViewLink = uploadResponse.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`

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

    const downloadLink =
      downloadResponse.data.webContentLink || `https://drive.google.com/uc?id=${fileId}&export=download`

    return {
      fileId,
      webViewLink,
      downloadLink,
    }
  } catch (error) {
    console.error("Error al subir archivo a Google Drive:", error)
    throw error
  }
}



export async function GET(request: Request) {
  try {
    // Get username from the request headers
    const username = await getUsernameFromRequest(request)

    if (!username) {
      return NextResponse.json({ error: "Unauthorized - Username not provided" }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get("search") || ""
    const startDate = searchParams.get("startDate") || ""
    const endDate = searchParams.get("endDate") || ""

    // Build the query with filters
    let sql = `SELECT m.*, 
             (SELECT COUNT(DISTINCT speaker) 
              FROM transcriptions 
              WHERE meeting_id = m.id 
              AND speaker IS NOT NULL 
              AND speaker != '') as participants
             FROM meetings m 
             WHERE m.username = ?`
    const params = [username]

    // Add search filter if provided
    if (searchTerm) {
      sql += ` AND (m.title LIKE ? OR m.summary LIKE ?)`
      params.push(`%${searchTerm}%`, `%${searchTerm}%`)
    }

    // Add date filters if provided
    if (startDate) {
      sql += ` AND m.date >= ?`
      params.push(startDate)
    }

    if (endDate) {
      sql += ` AND m.date <= ?`
      params.push(endDate)
    }

    // Order by date
    sql += ` ORDER BY m.date DESC`

    // Execute the query
    const meetings = await query(sql, params)

    return NextResponse.json(meetings)
  } catch (error) {
    console.error("Error fetching meetings:", error)
    return NextResponse.json({ error: "Error fetching meetings", details: String(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Obtener el nombre de usuario del encabezado
    const username = await getUsernameFromRequest(request)

    if (!username) {
      console.log("Error: Username no proporcionado")
      return NextResponse.json({ error: "Username is required" }, { status: 400 })
    }

    console.log("Username recibido:", username)

    // Obtener los datos de la solicitud
    const data = await request.json()
    console.log("Datos recibidos:", {
      title: data.title,
      date: data.date,
      transcriptionLength: data.transcription?.length || 0,
      hasAnalysis: !!data.analysis,
    })

    // Validar datos mínimos requeridos
    if (!data.title) {
      console.log("Error: Título no proporcionado")
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    if (!data.date) {
      console.log("Error: Fecha no proporcionada")
      return NextResponse.json({ error: "Date is required" }, { status: 400 })
    }

    // Insertar solo los datos básicos de la reunión primero
    const insertQuery = `
      INSERT INTO meetings 
      (username, title, date, summary, duration, participants) 
      VALUES (?, ?, ?, ?, ?, ?)
    `

    const insertParams = [
      username,
      data.title,
      new Date(data.date),
      data.summary || null,
      data.duration || null,
      data.participants || null,
    ]

    console.log("Ejecutando consulta:", { query: insertQuery, params: insertParams })

    const result = await query(insertQuery, insertParams)
    const meetingId = result.insertId

    console.log("Reunión creada con ID:", meetingId)

    // Si hay transcripción, guardarla en una operación separada
    if (data.transcription && Array.isArray(data.transcription) && data.transcription.length > 0) {
      try {
        console.log(`Insertando ${data.transcription.length} elementos de transcripción`)

        // Insertar cada elemento de transcripción individualmente para evitar errores
        for (const item of data.transcription) {
          await query(
            `INSERT INTO transcriptions 
            (meeting_id, time, speaker, text, created_at) 
            VALUES (?, ?, ?, ?, NOW())`,
            [meetingId, item.time || "00:00", item.speaker || "Unknown", item.text || ""],
          )
        }
        console.log("Transcripción guardada correctamente")

        // Si hay puntos clave, guardarlos
        if (data.keyPoints && Array.isArray(data.keyPoints) && data.keyPoints.length > 0) {
          try {
            console.log(`Insertando ${data.keyPoints.length} puntos clave`)

            for (const point of data.keyPoints) {
              await query(
                `INSERT INTO key_points 
                (meeting_id, point_text, order_num, created_at) 
                VALUES (?, ?, ?, NOW())`,
                [meetingId, point, data.keyPoints.indexOf(point) + 1],
              )
            }
            console.log("Puntos clave guardados correctamente")
          } catch (keyPointsError) {
            console.error("Error al guardar los puntos clave:", keyPointsError)
            // Continuar aunque falle la inserción de puntos clave
          }
        }
      } catch (transcriptionError) {
        console.error("Error al guardar la transcripción:", transcriptionError)
        // Continuar aunque falle la transcripción
      }
    }

    // Si hay tareas, guardarlas usando el taskService
    if (data.tasks && Array.isArray(data.tasks) && data.tasks.length > 0) {
      try {
        // Importar el servicio de tareas (no necesitamos modificar el import ya que es un archivo de servidor)
        const { taskService } = await import("@/services/taskService")

        console.log(`Creando ${data.tasks.length} tareas desde el análisis de la reunión`)

        // Usar la función existente para crear tareas desde el análisis
        await taskService.createTasksFromMeeting(username, meetingId, data.tasks)

        console.log("Tareas guardadas correctamente")
      } catch (tasksError) {
        console.error("Error al guardar las tareas:", tasksError)
        // Continuar aunque falle la inserción de tareas
      }
    }

    // Responder con éxito
    return NextResponse.json({
      success: true,
      meetingId,
      message: "Meeting created successfully",
    })
  } catch (error) {
    console.error("Error creating meeting:", error)
    return NextResponse.json(
      {
        error: "Failed to create meeting",
        details: String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

// Importar la función query
// import { query } from "@/utils/mysql"
