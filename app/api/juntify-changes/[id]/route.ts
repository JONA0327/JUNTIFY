import { NextResponse } from "next/server"
import { juntifyChangesService } from "@/services/juntifyChangesService"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 })
    }
    const { version, description } = await request.json()
    if (!version || !description) {
      return NextResponse.json({ error: "Version and description required" }, { status: 400 })
    }
    const change = await juntifyChangesService.updateChange(id, version, description)
    if (!change) {
      return NextResponse.json({ error: "Change not found" }, { status: 404 })
    }
    return NextResponse.json(change)
  } catch (error) {
    console.error("Error updating juntify change:", error)
    return NextResponse.json({ error: "Error updating juntify change" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 })
    }
    const success = await juntifyChangesService.deleteChange(id)
    if (!success) {
      return NextResponse.json({ error: "Change not found" }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting juntify change:", error)
    return NextResponse.json({ error: "Error deleting juntify change" }, { status: 500 })
  }
}
