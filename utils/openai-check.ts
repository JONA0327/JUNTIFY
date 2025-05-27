import { openai } from "@ai-sdk/openai"

/**
 * Verifica si la API de OpenAI está configurada correctamente
 * @returns Un objeto con el estado de la configuración
 */
export async function checkOpenAIConfig() {
  try {
    // Verificar si existe la clave de API
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return {
        isConfigured: false,
        error: "No se ha configurado la clave de API de OpenAI (OPENAI_API_KEY)",
      }
    }

    // Intentar una llamada simple a la API
    const { text } = await generateText({
      model: openai("gpt-4o"),
      messages: [{ role: "user", content: "Hola" }],
      temperature: 0.7,
      maxTokens: 10,
    })

    return {
      isConfigured: true,
      message: "La API de OpenAI está configurada correctamente",
    }
  } catch (error) {
    console.error("Error al verificar la configuración de OpenAI:", error)
    return {
      isConfigured: false,
      error: error instanceof Error ? error.message : "Error desconocido al verificar la configuración",
    }
  }
}

// Importar generateText
import { generateText } from "ai"
