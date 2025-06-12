import { NextResponse } from "next/server"
import { taskService } from "@/services/taskService"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // Autenticación desactivada temporalmente para facilitar pruebas

    const taskId = Number.parseInt(params.id)

    if (isNaN(taskId)) {
      return NextResponse.json({ error: "ID de tarea inválido" }, { status: 400 })
    }

    // Obtener la tarea con sus comentarios
    const task = await taskService.getTaskById(taskId)

    if (!task) {
      return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 })
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error("Error al obtener tarea:", error)
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 })
  }
}

// Implementar tanto PUT como PATCH para actualizaciones
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  return handleUpdate(request, params)
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  return handleUpdate(request, params)
}

// Función común para manejar actualizaciones (tanto PUT como PATCH)
async function handleUpdate(request: Request, params: { id: string }) {
  try {
    // Desactivar temporalmente la verificación de autenticación
    // const supabase = getSupabaseClient()
    // const {
    //   data: { session },
    // } = await supabase.auth.getSession()

    // if (!session) {
    //   return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    // }

    const taskId = Number.parseInt(params.id)

    if (isNaN(taskId)) {
      return NextResponse.json({ error: "ID de tarea inválido" }, { status: 400 })
    }

    const updates = await request.json()
    console.log("Recibiendo actualización de tarea:", updates)

    // Validar fecha
    if (updates.due_date) {
      // Asegurarse de que la fecha esté en formato YYYY-MM-DD
      if (!/^\d{4}-\d{2}-\d{2}$/.test(updates.due_date)) {
        return NextResponse.json({ error: "Formato de fecha inválido. Debe ser YYYY-MM-DD" }, { status: 400 })
      }
    }

    const updatedTask = await taskService.updateTask(taskId, updates)

    if (!updatedTask) {
      return NextResponse.json({ error: "No se pudo actualizar la tarea" }, { status: 500 })
    }

    console.log("Tarea actualizada con éxito:", updatedTask)
    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error("Error al actualizar tarea:", error)
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // Autenticación deshabilitada temporalmente

    const taskId = Number.parseInt(params.id)

    if (isNaN(taskId)) {
      return NextResponse.json({ error: "ID de tarea inválido" }, { status: 400 })
    }

    const success = await taskService.deleteTask(taskId)

    if (!success) {
      return NextResponse.json({ error: "No se pudo eliminar la tarea" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al eliminar tarea:", error)
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 })
  }
}
