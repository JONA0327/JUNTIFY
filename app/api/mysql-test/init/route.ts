import { NextResponse } from "next/server"
import { initializeDatabase } from "@/utils/db-init"

export async function POST() {
  try {
    const success = await initializeDatabase()

    if (success) {
      return NextResponse.json({
        success: true,
        initialized: true,
      })
    } else {
      return NextResponse.json({
        success: false,
        error: "Failed to initialize database",
      })
    }
  } catch (error) {
    console.error("Error initializing database:", error)
    return NextResponse.json({
      success: false,
      error: error.message || "Unknown error occurred",
    })
  }
}
