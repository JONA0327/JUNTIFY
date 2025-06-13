import { NextResponse } from "next/server"
import { query, queryOne } from "@/utils/mysql"

export async function GET(request: Request) {
  try {
    const username = request.headers.get("X-Username")
    if (!username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await queryOne(
      "SELECT id, full_name FROM users WHERE username = ? OR email = ?",
      [username, username],
    )
    const userId = user?.id
    const fullName = user?.full_name || username

    const { searchParams } = new URL(request.url)
    const meetingId = searchParams.get("meetingId")
    const assignee = searchParams.get("assignee")
    const completed = searchParams.get("completed")

    let sql = `
      SELECT t.*, m.title as meeting_title
      FROM tasks t
      LEFT JOIN meetings m ON t.meeting_id = m.id
      WHERE (m.username = ? OR t.assignee = ?
    `;
    const params: any[] = [username, fullName];

    if (userId) {
      sql += " OR t.user_id = ?"
      params.push(userId)
    }
    sql += ")"

    if (meetingId) {
      sql += " AND t.meeting_id = ?"
      params.push(meetingId)
    }
    if (assignee) {
      sql += " AND t.assignee = ?"
      params.push(assignee)
    }
    if (completed !== null && completed !== undefined) {
      sql += " AND t.completed = ?"
      params.push(completed === "true" || completed === "1")
    }

    sql += " ORDER BY t.due_date ASC, t.priority DESC"

    const tasks = await query(sql, params)
    const mapped = tasks.map((t: any) => ({
      id: t.id,
      text: t.text,
      description: t.description || "",
      assignee: t.assignee || "No asignado",
      dueDate: t.due_date,
      priority: t.priority || "media",
      progress: t.progress || 0,
      completed: !!t.completed,
      meeting_id: t.meeting_id,
      meeting_title: t.meeting_title,
    }))

    return NextResponse.json(mapped)
  } catch (error) {
    console.error("API ERROR: Error fetching tasks:", error)
    return NextResponse.json(
      { error: "Error fetching tasks", details: String(error) },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const username = request.headers.get("X-Username")
    if (!username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await queryOne(
      "SELECT id, full_name FROM users WHERE username = ? OR email = ?",
      [username, username],
    )
    const userId = user?.id
    const fullName = user?.full_name || username

    const body = await request.json()
    const { text, description, assignee, dueDate, priority, meetingId } = body

    if (!text) {
      return NextResponse.json({ error: "Task text is required" }, { status: 400 })
    }

    const result = await query(
      `INSERT INTO tasks
       (user_id, meeting_id, text, description, assignee, due_date, completed, priority, progress, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        userId || null,
        meetingId || null,
        text,
        description || null,
        assignee || fullName,
        dueDate || null,
        false,
        priority || "media",
        0,
      ],
    )

    const taskId = result["insertId"]
    const task = await query(
      `SELECT t.*, m.title as meeting_title FROM tasks t LEFT JOIN meetings m ON t.meeting_id = m.id WHERE t.id = ?`,
      [taskId],
    )
    const mapped = {
      id: task[0].id,
      text: task[0].text,
      description: task[0].description || "",
      assignee: task[0].assignee || "No asignado",
      dueDate: task[0].due_date,
      priority: task[0].priority || "media",
      progress: task[0].progress || 0,
      completed: !!task[0].completed,
      meeting_id: task[0].meeting_id,
      meeting_title: task[0].meeting_title,
    }
    return NextResponse.json(mapped)
  } catch (error) {
    console.error("API ERROR: Error creating task:", error)
    return NextResponse.json(
      { error: "Error creating task", details: String(error) },
      { status: 500 },
    )
  }
}
