import { NextResponse } from "next/server"
import { containerService } from "@/services/containerService"
import { getUsernameFromRequest } from "@/utils/user-helpers"

export async function GET(request: Request) {
  const username = await getUsernameFromRequest(request as any)
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const containers = await containerService.getContainers(username)
  return NextResponse.json(containers)
}

export async function POST(request: Request) {
  const username = await getUsernameFromRequest(request as any)
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { name } = await request.json()
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 })
  }
  const container = await containerService.createContainer(username, name)
  return NextResponse.json(container)
}
