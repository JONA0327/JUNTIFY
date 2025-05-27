import { NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { query } from "@/utils/mysql"

export async function POST(request: Request) {
  try {
    // Get username from the request headers
    const username = request.headers.get("X-Username")

    if (!username) {
      console.error("API request missing username in headers")
      return NextResponse.json({ error: "Unauthorized - Username not provided" }, { status: 401 })
    }

    // Parse the request body
    const body = await request.json()
    const { messages, meetingId, searchWeb } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "No se proporcionaron mensajes válidos" }, { status: 400 })
    }

    // Get meeting details if meetingId is provided
    let meetingContext = ""
    if (meetingId) {
      try {
        // Get complete meeting details including all related data
        const meetingResult = await query("SELECT * FROM meetings WHERE id = ? AND username = ?", [meetingId, username])

        if (meetingResult.length === 0) {
          return NextResponse.json({ error: "Reunión no encontrada" }, { status: 404 })
        }

        const meeting = meetingResult[0]

        // Get transcription
        const transcriptionResult = await query("SELECT * FROM transcriptions WHERE meeting_id = ? ORDER BY id ASC", [
          meetingId,
        ])

        // Get key points
        const keyPointsResult = await query("SELECT * FROM key_points WHERE meeting_id = ? ORDER BY order_num ASC", [
          meetingId,
        ])

        // Get tasks
        const tasksResult = await query(
          "SELECT * FROM tasks WHERE meeting_id = ? ORDER BY due_date ASC, priority DESC",
          [meetingId],
        )

        // Format all meeting data for context
        meetingContext = `
Contexto completo de la reunión "${meeting.title}" (${meeting.date ? new Date(meeting.date).toLocaleDateString() : "Fecha desconocida"}):

RESUMEN:
${meeting.summary || "No hay resumen disponible."}

PUNTOS CLAVE:
${
  keyPointsResult.length > 0
    ? keyPointsResult.map((point, index) => `${index + 1}. ${point.point_text}`).join("\n")
    : "No hay puntos clave disponibles."
}

TAREAS ASIGNADAS:
${
  tasksResult.length > 0
    ? tasksResult
        .map(
          (task) =>
            `- ${task.text} | Asignado a: ${task.assignee || "No asignado"} | Fecha límite: ${task.due_date ? new Date(task.due_date).toLocaleDateString() : "Sin fecha"} | Estado: ${task.completed ? "Completada" : "Pendiente"}`,
        )
        .join("\n")
    : "No hay tareas asignadas."
}

TRANSCRIPCIÓN COMPLETA:
${
  transcriptionResult.length > 0
    ? transcriptionResult
        .map((segment) => `${segment.speaker || "Hablante"} (${segment.time || "00:00"}): ${segment.text}`)
        .join("\n")
    : "No hay transcripción disponible."
}
`
      } catch (error) {
        console.error("Error fetching meeting details:", error)
        // Continue without meeting context if there's an error
        meetingContext =
          "Error al obtener el contexto de la reunión. Responde basándote solo en la pregunta del usuario."
      }
    }

    // Check if OPENAI_API_KEY is available
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "API Key de OpenAI no configurada" }, { status: 500 })
    }

    // Prepare system message with instructions
    const systemMessage = {
      role: "system",
      content: `Eres un asistente de IA especializado en analizar y responder preguntas sobre reuniones. 
${meetingContext ? "Tienes acceso a toda la información de la reunión que se muestra a continuación, incluyendo transcripción completa, resumen, puntos clave y tareas asignadas." : "No tienes acceso a ninguna transcripción específica en este momento."}
${searchWeb ? "Puedes buscar información complementaria en internet si es necesario." : "No busques información en internet, responde solo con lo que sabes o con la información de la reunión."}

IMPORTANTE SOBRE FECHAS: Cuando el usuario mencione referencias temporales relativas como "mañana", "la próxima semana", "este viernes", etc., interprétalas correctamente basándote en la fecha actual (${new Date().toLocaleDateString()}). Si el usuario pregunta por tareas para "mañana", entiende que se refiere a ${new Date(Date.now() + 86400000).toLocaleDateString()}.

Responde de manera concisa, profesional y útil. Si te preguntan sobre algo específico de la reunión, busca en la transcripción, resumen, puntos clave o tareas para dar una respuesta precisa. Si no encuentras la información o no conoces la respuesta, indícalo claramente.

${meetingContext}
`,
    }

    // Combine system message with user messages
    const conversationMessages = [systemMessage, ...messages]

    // Call the AI to generate a response
    const { text } = await generateText({
      model: openai("gpt-4o"),
      messages: conversationMessages,
      temperature: 0.7,
      maxTokens: 1000,
    })

    // Return the AI response
    return NextResponse.json({
      response: text,
    })
  } catch (error) {
    console.error("Error in AI chat:", error)
    return NextResponse.json(
      {
        error: "Error al procesar la solicitud",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
