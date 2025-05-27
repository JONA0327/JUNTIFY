import { NextResponse } from "next/server"
import { query } from "@/utils/mysql"
import { type AnalyzerType, getAnalyzer, processAnalyzerResponse } from "@/utils/analyzers"

// Interfaz para la estructura de respuesta del análisis
interface AnalysisResult {
  summary: string
  keyPoints: string[]
  tasks: {
    id: string
    text: string
    assignee: string
    dueDate: string
    context?: string
  }[]
  metadata?: {
    analysisType: AnalyzerType
    confidence?: number
    processingTime?: number
    [key: string]: any
  }
}

export async function POST(request: Request) {
  try {
    // Get username from the request headers
    const username = request.headers.get("X-Username")

    if (!username) {
      return NextResponse.json({ error: "Unauthorized - Username not provided" }, { status: 401 })
    }

    // Check if the user has reached their monthly limit
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    const usageRecords = await query(
      `SELECT COUNT(*) as count FROM meetings 
       WHERE username = ? 
       AND MONTH(created_at) = ? 
       AND YEAR(created_at) = ?`,
      [username, currentMonth, currentYear],
    )

    const used = usageRecords[0]?.count || 0
    const limit = 50
    const remaining = Math.max(0, limit - used)

    // If the user has reached their limit, return an error
    if (remaining <= 0) {
      return NextResponse.json(
        {
          error: `Has alcanzado el límite de ${limit} transcripciones este mes`,
          usage: { used, limit, remaining },
        },
        { status: 403 },
      )
    }

    // Parse the request body
    const body = await request.json()
    const { transcription, analyzerType = "standard" } = body

    if (!transcription || transcription.length === 0) {
      return NextResponse.json({ error: "No se proporcionó una transcripción válida" }, { status: 400 })
    }

    // Format the transcription for the AI with more detailed information
    const formattedTranscription = transcription
      .map((item) => `${item.speaker} (${item.time || "00:00"}): ${item.text}`)
      .join("\n")

    // Obtener el analizador seleccionado
    const analyzer = getAnalyzer(analyzerType as AnalyzerType)

    try {
      // Registrar el inicio del procesamiento para medir el tiempo
      const startTime = Date.now()

      // Call the OpenAI API with the specified model
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o", // Modelo principal
          messages: [
            {
              role: "system",
              content: analyzer.systemPrompt,
            },
            {
              role: "user",
              content: analyzer.userPromptTemplate(formattedTranscription),
            },
          ],
          temperature: analyzer.temperature,
          max_tokens: 4000,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error detallado de OpenAI:", errorData)

        // Si el error es por el modelo, intentar con un modelo alternativo
        if (
          errorData.error?.code === "model_not_found" ||
          (errorData.error?.message && errorData.error.message.includes("model"))
        ) {
          console.log("Modelo no encontrado, intentando con modelo alternativo...")

          // Segundo intento con modelo alternativo
          const fallbackResponse = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: "gpt-3.5-turbo-16k", // Modelo alternativo
              messages: [
                {
                  role: "system",
                  content: analyzer.systemPrompt,
                },
                {
                  role: "user",
                  content: analyzer.userPromptTemplate(formattedTranscription),
                },
              ],
              temperature: analyzer.temperature,
              max_tokens: 4000,
            }),
          })

          if (!fallbackResponse.ok) {
            const fallbackErrorData = await fallbackResponse.json()
            throw new Error(
              `Error en el modelo alternativo: ${fallbackErrorData.error?.message || fallbackResponse.statusText}`,
            )
          }

          const fallbackData = await fallbackResponse.json()
          const processingTime = Date.now() - startTime
          return processAIResponse(fallbackData, used, limit, remaining, analyzerType as AnalyzerType, processingTime)
        }

        throw new Error(`Error en la API de OpenAI: ${errorData.error?.message || response.statusText}`)
      }

      const data = await response.json()
      const processingTime = Date.now() - startTime
      return processAIResponse(data, used, limit, remaining, analyzerType as AnalyzerType, processingTime)
    } catch (aiError) {
      console.error("AI Error:", aiError)
      return NextResponse.json(
        {
          error: "Error en el procesamiento de la inteligencia artificial",
          details: aiError.message,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error analyzing transcription:", error)
    return NextResponse.json(
      {
        error: "Error al procesar la solicitud",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

// Función auxiliar para procesar la respuesta de la IA
function processAIResponse(data, used, limit, remaining, analyzerType: AnalyzerType, processingTime: number) {
  let content = data.choices[0].message.content

  // Limpiar la respuesta de cualquier marcador de código Markdown
  content = content
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim()

  // Parse the AI response
  let analysisResult: AnalysisResult
  try {
    // We need to handle the case where the AI might not return a valid JSON
    // First, try to extract just the JSON part if there's additional text
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    const jsonText = jsonMatch ? jsonMatch[0] : content

    const parsedResult = JSON.parse(jsonText)

    // Procesar la respuesta según el tipo de analizador
    const processedResponse = processAnalyzerResponse(analyzerType, parsedResult)

    // Formato estándar para todos los analizadores
    analysisResult = {
      summary: processedResponse.summary || "No se pudo generar un resumen.",
      keyPoints: processedResponse.keyPoints || [],
      tasks: Array.isArray(processedResponse.tasks)
        ? processedResponse.tasks.map((task, index) => ({
            id: task.id || String(index + 1),
            text: task.text || "Tarea sin descripción",
            assignee: task.assignee || "No asignado",
            dueDate: task.dueDate || "No definida",
            context: task.context || "",
          }))
        : [],
      metadata: {
        analysisType: analyzerType,
        confidence: 0.85,
        processingTime,
        ...processedResponse.metadata,
      },
    }
  } catch (parseError) {
    console.error("Error parsing AI response:", parseError, "Content:", content)
    // Provide a fallback analysis result
    analysisResult = {
      summary: "No se pudo analizar la transcripción correctamente.",
      keyPoints: ["Se encontró un error al procesar la transcripción."],
      tasks: [],
      metadata: {
        analysisType: analyzerType,
        confidence: 0.1,
        processingTime,
        error: parseError.message,
      },
    }
  }

  // Return the analysis result with usage information
  return NextResponse.json({
    ...analysisResult,
    usage: {
      used,
      limit,
      remaining: remaining - 1, // Decrease by one since we're using one now
    },
  })
}
