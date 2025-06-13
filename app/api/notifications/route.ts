import { NextResponse } from "next/server"
import { getUsernameFromRequest } from "@/utils/user-helpers"
import { notificationService } from "@/services/notificationService"

export async function GET(request: Request) {
  try {
    const username = await getUsernameFromRequest(request as any)
    if (!username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const notifications = await notificationService.getNotifications(username)
    return NextResponse.json(notifications)
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const username = await getUsernameFromRequest(request as any)
    if (!username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { message } = await request.json()
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 })
    }
    const notification = await notificationService.createNotification(username, message)
    return NextResponse.json(notification)
  } catch (error) {
    console.error("Error creating notification:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
