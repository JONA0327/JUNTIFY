import { NextResponse } from "next/server"
import { checkOpenAIConfig } from "@/utils/openai-check"

export async function GET() {
  try {
    const result = await checkOpenAIConfig()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error checking OpenAI configuration:", error)
    return NextResponse.json(
      {
        isConfigured: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
