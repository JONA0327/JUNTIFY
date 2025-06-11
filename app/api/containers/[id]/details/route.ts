import { NextResponse } from "next/server"
import { containerService } from "@/services/containerService"
import { getUsernameFromRequest } from "@/utils/user-helpers"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const username = await getUsernameFromRequest(request as any)
  if (!username) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const id = Number.parseInt(params.id)
  if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })

  const details = await containerService.getContainerDetails(id, username)
  return NextResponse.json(details)
}
