import { NextResponse } from "next/server"
import { feedbackService } from "@/services/feedbackService"

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 })
    }
    const success = await feedbackService.deleteFeedback(id)
    if (!success) {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting feedback:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
