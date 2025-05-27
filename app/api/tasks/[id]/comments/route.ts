import { NextResponse } from "next/server"
import { taskService } from "@/services/taskService"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // Obtener el ID de la tarea
    const taskId = Number.parseInt(params.id)

    if (isNaN(taskId)) {
      return NextResponse.json({ error: "ID de tarea inválido" }, { status: 400 })
    }

    // Obtener los comentarios
    const comments = await taskService.getTaskComments(taskId)

    return NextResponse.json(comments)
  } catch (error) {
    console.error("Error al obtener comentarios:", error)
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    // Obtener el ID de la tarea
    const taskId = Number.parseInt(params.id)

    if (isNaN(taskId)) {
      return NextResponse.json({ error: "ID de tarea inválido" }, { status: 400 })
    }

    // Obtener los datos del comentario
    const commentData = await request.json()

    if (!commentData.author || !commentData.text) {
      return NextResponse.json({ error: "Datos de comentario incompletos" }, { status: 400 })
    }

    // Añadir el comentario
    const comment = await taskService.addTaskComment(taskId, {
      author: commentData.author,
      text: commentData.text,
    })

    if (!comment) {
      return NextResponse.json({ error: "No se pudo añadir el comentario" }, { status: 500 })
    }

    return NextResponse.json(comment)
  } catch (error) {
    console.error("Error al añadir comentario:", error)
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 })
  }
}
