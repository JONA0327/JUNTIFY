// Función para analizar la transcripción con OpenAI
export async function analyzeTranscription(transcription: any[]) {
  try {
    // Preparar el texto de la transcripción para el análisis
    const transcriptionText = transcription.map((item) => `${item.speaker}: ${item.text}`).join("\n")

    // Prompt especializado en exposiciones, clases y convenciones con resumen extenso
    const prompt = `
Analiza la siguiente transcripción que puede corresponder a una exposición académica, clase escolar, conferencia o convención. Proporciona un análisis detallado y completo:

Transcripción:
${transcriptionText}

Antes de responder, evalúa la longitud y el tipo de la transcripción, considerando si parece ser:
- Una clase o exposición educativa
- Una conferencia o presentación profesional
- Una convención o mesa redonda
- Otro tipo de reunión formal

Basado en esta evaluación, ajusta tu respuesta de la siguiente manera:

1. RESUMEN EXTENSO:
   - IMPORTANTE: Genera un resumen DETALLADO Y EXTENSO de entre 800-1200 palabras (aproximadamente 8-12 párrafos).
   - El resumen debe ser académico y profundo, capturando:
     * Conceptos principales explicados
     * Metodologías o técnicas presentadas
     * Ejemplos o casos de estudio mencionados
     * Preguntas importantes y sus respuestas
     * Debates o discusiones relevantes
   
   - Estructura del resumen:
     * Introducción (1-2 párrafos): Contexto general y objetivos de la sesión
     * Desarrollo temático (5-8 párrafos): Análisis detallado de cada tema principal, con subtemas y ejemplos
     * Aspectos pedagógicos (1-2 párrafos): Métodos de enseñanza, recursos utilizados, dinámicas de grupo
     * Conclusiones (1-2 párrafos): Síntesis de aprendizajes clave y próximos pasos

2. PUNTOS CLAVE ACADÉMICOS:
   - Identifica entre 10-20 puntos clave académicos o conceptuales
   - Incluye definiciones importantes, teorías, metodologías y conclusiones relevantes
   - Organiza los puntos en orden de importancia conceptual

3. TAREAS Y ASIGNACIONES:
   - Identifica todas las tareas, lecturas, ejercicios o asignaciones mencionadas
   - Para cada tarea, especifica:
     * Descripción detallada
     * Persona asignada o grupo responsable
     * Fecha límite (convierte referencias temporales como "próxima clase" a fechas específicas basadas en la fecha actual: ${new Date().toISOString().split("T")[0]})
     * Recursos necesarios o recomendados

Es IMPORTANTE que respondas SOLO con un objeto JSON válido con la siguiente estructura y sin más texto adicional:
{
  "summary": "Resumen extenso y detallado de la sesión académica o profesional",
  "keyPoints": ["Concepto 1", "Teoría 2", ...],
  "tasks": [{"id": "1", "text": "Tarea o asignación 1", "assignee": "Estudiante/Grupo o 'Toda la clase'", "dueDate": "Fecha límite o 'Próxima sesión'"}, ...],
  "metadata": {"sessionType": "clase/exposición/conferencia/convención", "wordCount": número_aproximado_de_palabras, "mainTopics": ["Tema principal 1", "Tema principal 2"]}
}
`

    // Modificar la configuración de la llamada a la API para permitir respuestas más largas
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo-16k",
        messages: [
          {
            role: "system",
            content:
              "Eres un asistente académico especializado en analizar y sintetizar clases, exposiciones educativas y conferencias profesionales. Tu objetivo es proporcionar resúmenes extensos y detallados con enfoque académico. Debes responder ÚNICAMENTE con un objeto JSON válido sin ningún texto adicional ni marcadores de código.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000, // Aumentado para permitir resúmenes más largos
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Error en la API de OpenAI: ${errorData.error?.message || response.statusText}`)
    }

    const data = await response.json()
    let content = data.choices[0].message.content

    // Limpiar la respuesta de cualquier marcador de código Markdown
    content = content
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim()

    console.log("Respuesta de OpenAI (limpia):", content)

    // Parsear la respuesta JSON
    try {
      const analysisResult = JSON.parse(content)
      return analysisResult
    } catch (parseError) {
      console.error("Error al parsear la respuesta de OpenAI:", parseError)
      console.error("Contenido que causó el error:", content)

      // Intentar extraer manualmente si el formato no es JSON perfecto
      return {
        summary: extractSummary(content),
        keyPoints: extractKeyPoints(content),
        tasks: extractTasks(content),
        metadata: {
          sessionType: "desconocido",
          wordCount: 0,
          mainTopics: [],
        },
      }
    }
  } catch (error) {
    console.error("Error al analizar la transcripción:", error)
    throw error
  }
}

// Función auxiliar para extraer el resumen
function extractSummary(content: string) {
  try {
    const summaryMatch = content.match(/"summary"\s*:\s*"(.*?)"/s)
    return summaryMatch ? summaryMatch[1] : "No se pudo generar un resumen."
  } catch (e) {
    return "No se pudo generar un resumen."
  }
}

// Funciones auxiliares para extraer datos si el JSON no es válido
function extractKeyPoints(content: string) {
  try {
    const keyPointsMatch = content.match(/"keyPoints"\s*:\s*\[(.*?)\]/s)
    if (keyPointsMatch && keyPointsMatch[1]) {
      return keyPointsMatch[1]
        .split(",")
        .map((point) => point.trim().replace(/^"/, "").replace(/"$/, ""))
        .filter((point) => point.length > 0)
    }
    return []
  } catch (e) {
    return []
  }
}

function extractTasks(content: string) {
  try {
    const tasksMatch = content.match(/"tasks"\s*:\s*\[(.*?)\]\s*\}/s)
    if (tasksMatch && tasksMatch[1]) {
      // Intentar extraer objetos de tarea individuales
      const taskObjects = []
      const taskRegex =
        /\{\s*"id"\s*:\s*"(.*?)"\s*,\s*"text"\s*:\s*"(.*?)"\s*,\s*"assignee"\s*:\s*"(.*?)"\s*,\s*"dueDate"\s*:\s*"(.*?)"\s*\}/g
      let match

      while ((match = taskRegex.exec(tasksMatch[1])) !== null) {
        taskObjects.push({
          id: match[1],
          text: match[2],
          assignee: match[3],
          dueDate: match[4],
        })
      }

      return taskObjects
    }
    return []
  } catch (e) {
    return []
  }
}
