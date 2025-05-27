import { NextResponse } from "next/server"
import { getAllAnalyzers } from "@/utils/analyzers"

export async function GET() {
  try {
    const analyzers = getAllAnalyzers().map((analyzer) => ({
      id: analyzer.id,
      name: analyzer.name,
      description: analyzer.description,
      icon: analyzer.icon,
    }))

    return NextResponse.json(analyzers)
  } catch (error) {
    console.error("Error fetching analyzers:", error)
    return NextResponse.json(
      {
        error: "Error al obtener los analizadores",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
