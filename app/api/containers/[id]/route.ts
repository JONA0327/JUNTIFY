import { NextResponse } from "next/server"
import { containerService } from "@/services/containerService"
import { getUsernameFromRequest } from "@/utils/user-helpers"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const username = await getUsernameFromRequest(request as any)
  if (!username) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const id = Number.parseInt(params.id)
  if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  const { name } = await request.json()
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 })
  const container = await containerService.renameContainer(id, username, name)
  if (!container) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(container)
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const username = await getUsernameFromRequest(request as any)
  if (!username) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const id = Number.parseInt(params.id)
  if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  const success = await containerService.deleteContainer(id, username)
  if (!success) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ success: true })
}
