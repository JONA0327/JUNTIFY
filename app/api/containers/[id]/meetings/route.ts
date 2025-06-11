import { NextResponse } from "next/server"
import { containerService } from "@/services/containerService"
import { getUsernameFromRequest } from "@/utils/user-helpers"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const username = await getUsernameFromRequest(request as any)
  if (!username) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const id = Number.parseInt(params.id)
  if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  const meetings = await containerService.listMeetings(id, username)
  return NextResponse.json(meetings)
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const username = await getUsernameFromRequest(request as any)
  if (!username) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const id = Number.parseInt(params.id)
  if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  const { meetingId } = await request.json()
  if (!meetingId) return NextResponse.json({ error: "meetingId required" }, { status: 400 })
  const ok = await containerService.addMeeting(id, meetingId, username)
  if (!ok) return NextResponse.json({ error: "Operation failed" }, { status: 400 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const username = await getUsernameFromRequest(request as any)
  if (!username) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const id = Number.parseInt(params.id)
  if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  const { meetingId } = await request.json()
  if (!meetingId) return NextResponse.json({ error: "meetingId required" }, { status: 400 })
  const ok = await containerService.removeMeeting(id, meetingId, username)
  if (!ok) return NextResponse.json({ error: "Operation failed" }, { status: 400 })
  return NextResponse.json({ success: true })
}
