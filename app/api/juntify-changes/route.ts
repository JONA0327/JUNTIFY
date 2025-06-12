import { NextResponse } from "next/server"
import { juntifyChangesService } from "@/services/juntifyChangesService"

export async function GET() {
  try {
    const changes = await juntifyChangesService.getAll()
    return NextResponse.json(changes)
  } catch (error) {
    console.error("Error fetching juntify changes:", error)
    return NextResponse.json({ error: "Error fetching juntify changes" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { version, description } = await request.json()
    if (!version || !description) {
      return NextResponse.json({ error: "Version and description required" }, { status: 400 })
    }
    const change = await juntifyChangesService.createChange(version, description)
    return NextResponse.json(change)
  } catch (error) {
    console.error("Error creating juntify change:", error)
    return NextResponse.json({ error: "Error creating juntify change" }, { status: 500 })
  }
}
