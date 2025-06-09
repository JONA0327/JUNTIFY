"use client"

import { useState, useEffect } from "react"
import { NewNavbar } from "@/components/new-navbar"
import {
  Search,
  Calendar,
  Plus,
  Edit,
  Trash2,
  Check,
  MessageSquare,
  Users,
  User,
  CheckSquare,
  Link,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { NewTaskModal } from "@/components/new-task-modal"
import { EditTaskModal } from "@/components/edit-task-modal"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getSupabaseClient } from "@/utils/supabase"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getUsername, storeUsername } from "@/utils/user-helpers"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

// Tipo para usuario con rol
type UserRole = "admin" | "member"

// Tipo para una tarea
interface Task {
  id: number
  text: string
  description?: string
  assignee: string
  dueDate: string
  completed: boolean
  meeting_id?: number
  meeting_title?: string
  priority: "baja" | "media" | "alta"
  progress: number
  comments?: { author: string; text: string; date: string }[]
}

// Tipo para una reunión
interface Meeting {
  id: number
  title: string
}

// Componente para una tarea individual
const TaskItem = ({ task, userRole, onToggleComplete, onEdit, onDelete }) => {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed
  const hasComments = task.comments && task.comments.length > 0

  return (
    <div
      className={`p-4 rounded-lg border ${
        task.completed
          ? "bg-blue-800/10 border-blue-700/20"
          : isOverdue
            ? "bg-red-900/10 border-red-700/30"
            : "bg-blue-800/30 border-blue-700/30"
      } mb-3`}
    >
      <div className="flex items-start">
        <button
          className={`h-6 w-6 rounded border flex-shrink-0 mr-3 mt-1 flex items-center justify-center ${
            task.completed ? "bg-green-500 border-green-600" : isOverdue ? "border-red-500" : "border-blue-500"
          }`}
          onClick={() => onToggleComplete(task.id)}
        >
          {task.completed && <Check className="h-3 w-3 text-white" />}
        </button>

        <div className="flex-1">
          <div className="flex justify-between">
            <p className={`${task.completed ? "text-blue-300/70 line-through" : "text-white"}`}>{task.text}</p>
          </div>

          {task.description && (
            <p className={`text-sm mt-1 ${task.completed ? "text-blue-300/50" : "text-blue-200/70"}`}>
              {task.description.length > 100 ? `${task.description.substring(0, 100)}...` : task.description}
            </p>
          )}

          <div className="mt-2 mb-2">
            <div className="flex items-center gap-2">
              <Progress value={task.progress} className="h-2 w-full bg-blue-800/50" />
              <span className="text-xs text-blue-200/70 min-w-10 text-right">{task.progress}%</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center text-sm mt-2 gap-x-4 gap-y-2">
            {/* Fecha límite - Siempre mostrar si existe */}
            {task.dueDate && (
              <div className="flex items-center text-blue-200/70">
                <Calendar className="h-3.5 w-3.5 mr-1" />
                <span className={isOverdue ? "text-red-300" : task.completed ? "text-blue-300/50" : "text-blue-200/70"}>
                  Fecha límite: {task.dueDate.split("T")[0].split("-").reverse().join("/")}
                </span>
              </div>
            )}

            <div className="flex items-center text-blue-200/70">
              <span
                className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                  task.priority === "alta" ? "bg-red-500" : task.priority === "media" ? "bg-yellow-500" : "bg-green-500"
                }`}
              ></span>
              <span className={task.completed ? "text-blue-300/50" : ""}>Prioridad {task.priority}</span>
            </div>

            <div className="flex items-center text-blue-200/70">
              <User className="h-3.5 w-3.5 mr-1" />
              <span className={task.completed ? "text-blue-300/50" : ""}>
                {task.assignee && task.assignee !== "No asignado" ? `Asignado a: ${task.assignee}` : "Sin asignar"}
              </span>
            </div>

            {task.meeting_title && (
              <div className="flex items-center text-blue-200/70">
                <Link className="h-3.5 w-3.5 mr-1" />
                <span
                  className={`text-xs px-2 py-0.5 rounded-full bg-blue-700/40 ${task.completed ? "text-blue-300/50" : ""}`}
                >
                  {task.meeting_title}
                </span>
              </div>
            )}

            {hasComments && (
              <div className="flex items-center text-blue-200/70">
                <MessageSquare className="h-3.5 w-3.5 mr-1" />
                <span className="text-blue-300/70">{task.comments.length} comentario(s)</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex space-x-2 ml-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-blue-300 hover:text-white hover:bg-blue-800/50"
            onClick={() => onEdit(task)}
          >
            <Edit className="h-4 w-4" />
            <span className="sr-only">Editar</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-blue-300 hover:text-red-400 hover:bg-red-900/20"
            onClick={() => onDelete(task.id)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Eliminar</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

// Elemento simple para la barra lateral de tareas
const TaskSidebarItem = ({ task, isSelected, onSelect }) => {
  return (
    <div
      className={`p-2 rounded cursor-pointer mb-1 border border-blue-700/30 ${
        isSelected ? "bg-blue-700/40" : "bg-blue-800/30 hover:bg-blue-700/30"
      }`}
      onClick={() => onSelect(task)}
    >
      <p className={`text-sm ${task.completed ? "line-through text-blue-300/70" : "text-white"}`}>{task.text}</p>
      {task.dueDate && (
        <p className="text-xs text-blue-300/70">
          {task.dueDate.split("T")[0].split("-").reverse().join("/")}
        </p>
      )}
    </div>
  )
}

// Vista detallada de una tarea seleccionada
const TaskDetails = ({ task, userRole, onToggleComplete, onEdit, onDelete }) => {
  if (!task) {
    return (
      <div className="flex items-center justify-center h-full text-blue-300">
        Selecciona una tarea para ver los detalles
      </div>
    )
  }

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed

  return (
    <div className="p-4 bg-blue-800/20 border border-blue-700/30 rounded-lg">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-bold text-white">{task.text}</h2>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-blue-300 hover:text-white hover:bg-blue-800/50"
            onClick={() => onEdit(task)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-blue-300 hover:text-red-400 hover:bg-red-900/20"
            onClick={() => onDelete(task.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {task.description && (
        <p className="text-blue-200/70 mb-4 whitespace-pre-line">{task.description}</p>
      )}

      {task.dueDate && (
        <p className={`mb-2 ${isOverdue ? "text-red-300" : "text-blue-300"}`}>Fecha límite: {task.dueDate.split("T")[0].split("-").reverse().join("/")}</p>
      )}

      <div className="flex items-center gap-2 mb-4">
        <Progress value={task.progress} className="h-2 w-full bg-blue-800/50" />
        <span className="text-xs text-blue-200/70 min-w-10 text-right">{task.progress}%</span>
      </div>

      <div className="flex flex-wrap items-center text-sm gap-x-4 gap-y-2">
        <div className="flex items-center text-blue-200/70">
          <User className="h-3.5 w-3.5 mr-1" />
          <span>{task.assignee && task.assignee !== "No asignado" ? `Asignado a: ${task.assignee}` : "Sin asignar"}</span>
        </div>

        {task.meeting_title && (
          <div className="flex items-center text-blue-200/70">
            <Link className="h-3.5 w-3.5 mr-1" />
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-700/40">{task.meeting_title}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [viewMode, setViewMode] = useState<"my-tasks" | "organization-tasks">("my-tasks")
  const [tasks, setTasks] = useState<Task[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [selectedMeeting, setSelectedMeeting] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [showNewTaskModal, setShowNewTaskModal] = useState(false)
  const [showEditTaskModal, setShowEditTaskModal] = useState(false)
  const [currentTask, setCurrentTask] = useState<Task | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [organizationMembers, setOrganizationMembers] = useState([])
  const [userFullName, setUserFullName] = useState("")
  const [authError, setAuthError] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const router = useRouter()

  // Current user state
  const [currentUser, setCurrentUser] = useState({
    id: 0,
    name: "",
    role: "member" as UserRole,
  })

  // Check authentication status and get username
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("Verificando autenticación...")
        // First check if we have a username in localStorage
        const storedUsername = getUsername()

        if (storedUsername) {
          console.log("Username encontrado en localStorage:", storedUsername)
          setUsername(storedUsername)
          setAuthError(false)
          return
        }

        // If no username in localStorage, try to get it from Supabase session
        const supabase = getSupabaseClient()
        const { data, error } = await supabase.auth.getSession()

        if (error || !data.session) {
          console.error("Error de autenticación:", error)
          setAuthError(true)
          return
        }

        // Get username from profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", data.session.user.id)
          .single()

        if (profileData?.username) {
          console.log("Username obtenido de Supabase:", profileData.username)
          // Store username in localStorage for future use
          storeUsername(profileData.username)
          setUsername(profileData.username)
          setAuthError(false)
        } else {
          console.error("No se encontró username en el perfil")
          setAuthError(true)
        }
      } catch (error) {
        console.error("Error verificando autenticación:", error)
        setAuthError(true)
      }
    }

    checkAuth()
  }, [])

  // Función para obtener las tareas
  const fetchTasks = async (username: string) => {
    try {
      console.log("Iniciando fetchTasks con username:", username)
      setLoading(true)
      setError(null)

      if (!username) {
        console.error("No se proporcionó nombre de usuario")
        setError("No se encontró información de usuario. Por favor, inicia sesión nuevamente.")
        setLoading(false)
        return
      }

      // Construir la URL base
      let url = "/api/tasks"

      // Añadir el parámetro de meetingId solo si está seleccionado
      if (selectedMeeting && selectedMeeting !== "all") {
        url += `?meetingId=${selectedMeeting}`
      }

      console.log("Fetching tasks from URL:", url)

      try {
        const response = await fetch(url, {
          headers: {
            "X-Username": username,
          },
          cache: "no-store",
        })

        console.log("Response status:", response.status)

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`Error ${response.status}: ${response.statusText}`, errorText)
          throw new Error(`Error ${response.status}: ${response.statusText || "Sin mensaje de error"}`)
        }

        const data = await response.json()
        console.log(`Tareas recibidas: ${data.length}`)
        setTasks(data)
      } catch (err) {
        console.error("Error en fetchTasks:", err)
        setError(`Error al cargar las tareas: ${err.message}`)
      } finally {
        setLoading(false)
      }
    } catch (err) {
      console.error("Error general en fetchTasks:", err)
      setError(`Error al cargar las tareas: ${err.message || "Error desconocido"}`)
      setLoading(false)
    }
  }

  // Fetch conversations when username is available
  useEffect(() => {
    async function fetchData() {
      if (!username) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        console.log("Obteniendo datos con username:", username)

        // Set current user
        setCurrentUser({
          id: 0,
          name: username,
          role: "admin",
        })

        // Obtener información completa del usuario
        try {
          console.log("Obteniendo información adicional del usuario")
          const userResponse = await fetch("/api/users/me", {
            headers: {
              "X-Username": username,
            },
            cache: "no-store",
          })

          if (userResponse.ok) {
            const userData = await userResponse.json()
            setUserFullName(userData.full_name || username)
            console.log("Nombre completo del usuario:", userData.full_name)
          } else {
            console.warn("No se pudo obtener información adicional del usuario")
            setUserFullName(username)
          }
        } catch (err) {
          console.error("Error obteniendo información del usuario:", err)
          setUserFullName(username)
        }

        // Fetch meetings
        try {
          console.log("Obteniendo reuniones")
          const meetingsResponse = await fetch("/api/meetings", {
            headers: {
              "X-Username": username,
            },
            cache: "no-store",
          })

          if (meetingsResponse.ok) {
            const meetingsData = await meetingsResponse.json()
            console.log(`Reuniones recibidas: ${meetingsData.length}`)
            setMeetings(meetingsData)
          } else {
            console.error("Error al obtener reuniones:", meetingsResponse.status)
          }
        } catch (err) {
          console.error("Error fetching meetings:", err)
          // No establecer error aquí para no bloquear la UI
        }

        // Fetch tasks
        await fetchTasks(username)
      } catch (err) {
        console.error("Error en fetchData:", err)
        setError(`Error al cargar los datos: ${err.message || "Error desconocido"}`)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [username])

  // Handle meeting selection change
  useEffect(() => {
    if (username) {
      // Usar setTimeout para asegurar que el estado se actualiza antes de ejecutar la consulta
      setTimeout(() => {
        fetchTasks(username)
      }, 0)
    }
  }, [selectedMeeting, username])

  // Filtrar tareas según la vista activa (Mis tareas o Tareas de la organización)
  const viewFilteredTasks =
    viewMode === "my-tasks"
      ? tasks // Mostrar todas las tareas en "Mis tareas" para depuración
      : tasks.filter((task) => task.assignee !== userFullName && task.assignee !== "No asignado")

  // Filtrar tareas según la pestaña activa y el término de búsqueda
  const filteredTasks = viewFilteredTasks.filter((task) => {
    // Filtrar por término de búsqueda
    const matchesSearchTerm =
      searchTerm === "" ||
      task.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.assignee && task.assignee.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (task.meeting_title && task.meeting_title.toLowerCase().includes(searchTerm.toLowerCase()))

    // Filtrar por estado (completado/pendiente)
    if (activeTab === "completed") {
      return task.completed && matchesSearchTerm
    } else if (activeTab === "pending") {
      return !task.completed && matchesSearchTerm
    } else if (activeTab === "overdue") {
      return !task.completed && task.dueDate && new Date(task.dueDate) < new Date() && matchesSearchTerm
    }

    // Pestaña "todas"
    return matchesSearchTerm
  })

  // Añadir un log para depuración después de obtener las tareas
  useEffect(() => {
    console.log("Tareas disponibles para mostrar:", tasks.length)
    console.log("Tareas filtradas por vista:", viewFilteredTasks.length)
    console.log("Tareas filtradas finales:", filteredTasks.length)
  }, [tasks, viewFilteredTasks, filteredTasks])

  // Manejar el cambio de estado de una tarea
  const handleToggleComplete = async (taskId) => {
    try {
      const taskToUpdate = tasks.find((task) => task.id === taskId)

      if (!taskToUpdate) return

      if (!username) {
        setError("No se encontró información de usuario. Por favor, inicia sesión nuevamente.")
        return
      }

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Username": username,
        },
        body: JSON.stringify({
          completed: !taskToUpdate.completed,
          progress: !taskToUpdate.completed ? 100 : taskToUpdate.progress,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error response:", errorText)
        throw new Error(`Error ${response.status}: ${await response.text()}`)
      }

      // Update local state
      setTasks(
        tasks.map((task) =>
          task.id === taskId
            ? { ...task, completed: !task.completed, progress: !taskToUpdate.completed ? 100 : task.progress }
            : task,
        ),
      )

      toast({
        title: !taskToUpdate.completed ? "Tarea completada" : "Tarea marcada como pendiente",
        description: "El estado de la tarea ha sido actualizado correctamente.",
        variant: "default",
      })
    } catch (err) {
      console.error("Error updating task:", err)
      setError("Error al actualizar la tarea: " + err.message)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la tarea.",
        variant: "destructive",
      })
    }
  }

  // Manejar la edición de una tarea
  const handleEditTask = (task) => {
    setCurrentTask(task)
    setShowEditTaskModal(true)
  }

  // Manejar la eliminación de una tarea
  const handleDeleteTask = async (taskId) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta tarea?")) {
      try {
        if (!username) {
          setError("No se encontró información de usuario. Por favor, inicia sesión nuevamente.")
          return
        }

        const response = await fetch(`/api/tasks/${taskId}`, {
          method: "DELETE",
          headers: {
            "X-Username": username,
          },
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error("Error response:", errorText)
          throw new Error(`Error ${response.status}: ${await response.text()}`)
        }

        // Update local state
        setTasks(tasks.filter((task) => task.id !== taskId))

        toast({
          title: "Tarea eliminada",
          description: "La tarea ha sido eliminada correctamente.",
          variant: "default",
        })
      } catch (err) {
        console.error("Error deleting task:", err)
        setError("Error al eliminar la tarea: " + err.message)
        toast({
          title: "Error",
          description: "No se pudo eliminar la tarea.",
          variant: "destructive",
        })
      }
    }
  }

  // Manejar la creación de una tarea
  const handleCreateTask = async (newTask) => {
    try {
      if (!username) {
        setError("No se encontró información de usuario. Por favor, inicia sesión nuevamente.")
        return
      }

      // Usar directamente el string de fecha sin convertirlo a objeto Date
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Username": username,
        },
        body: JSON.stringify({
          text: newTask.text,
          description: newTask.description,
          assignee: newTask.assignee,
          dueDate: newTask.dueDate, // Usar directamente el string de fecha
          priority: newTask.priority,
          meetingId: newTask.meetingId !== "all" ? newTask.meetingId : null,
          progress: 0,
          completed: false,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error response:", errorText)
        throw new Error(`Error ${response.status}: ${await response.text()}`)
      }

      const createdTask = await response.json()

      // Update local state
      setTasks([...tasks, createdTask])
      setShowNewTaskModal(false)

      toast({
        title: "Tarea creada",
        description: "La tarea ha sido creada correctamente.",
        variant: "default",
      })
    } catch (err) {
      console.error("Error creating task:", err)
      setError("Error al crear la tarea: " + err.message)
      toast({
        title: "Error",
        description: "No se pudo crear la tarea.",
        variant: "destructive",
      })
    }
  }

  // Manejar la actualización de una tarea
  const handleUpdateTask = async (updatedTask) => {
    try {
      if (!username) {
        setError("No se encontró información de usuario. Por favor, inicia sesión nuevamente.")
        return false
      }

      console.log("Actualizando tarea:", updatedTask)
      console.log("Username usado para la solicitud:", username)

      // Verificar que due_date tenga un formato válido
      if (!updatedTask.due_date) {
        const errorMsg = "La fecha límite no puede estar vacía"
        console.error(errorMsg)
        setError(errorMsg)
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        })
        return false
      }

      // Asegurarse de que los campos tengan los nombres correctos para la API
      const apiPayload = {
        text: updatedTask.text,
        description: updatedTask.description,
        assignee: updatedTask.assignee,
        due_date: updatedTask.due_date, // Usar directamente el string de fecha
        priority: updatedTask.priority,
        progress: updatedTask.progress,
        completed: updatedTask.completed,
        meeting_id: updatedTask.meeting_id,
      }

      console.log("Payload para API:", apiPayload)

      // Verificar si estamos en ambiente de producción
      const baseUrl =
        window.location.hostname === "localhost"
          ? "" // En desarrollo, la URL base es vacía (relativa)
          : `${window.location.protocol}//${window.location.host}` // En producción, la URL completa

      console.log("Base URL para la solicitud:", baseUrl)

      const url = `${baseUrl}/api/tasks/${updatedTask.id}`
      console.log("URL completa para la solicitud:", url)

      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Username": username,
        },
        body: JSON.stringify(apiPayload),
        credentials: "same-origin", // Importante para las cookies
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error response:", errorText)
        throw new Error(`Error ${response.status}: ${errorText}`)
      }

      const responseData = await response.json()
      console.log("Respuesta de actualización:", responseData)

      // Convertir el formato de la respuesta para que coincida con el formato esperado por la UI
      const formattedTask = {
        ...responseData,
        dueDate: responseData.due_date, // Asegurar que dueDate esté disponible para la UI
      }

      // Update local state
      setTasks(tasks.map((task) => (task.id === updatedTask.id ? formattedTask : task)))
      setShowEditTaskModal(false)
      setCurrentTask(null)

      toast({
        title: "Tarea actualizada",
        description: "La tarea ha sido actualizada correctamente.",
        variant: "default",
      })

      return true
    } catch (err) {
      console.error("Error updating task:", err)
      setError("Error al actualizar la tarea: " + err.message)
      toast({
        title: "Error",
        description: "No se pudo actualizar la tarea: " + err.message,
        variant: "destructive",
      })
      return false
    }
  }

  // Contar tareas por estado
  const taskCounts = {
    all: filteredTasks.length,
    completed: filteredTasks.filter((task) => task.completed).length,
    pending: filteredTasks.filter((task) => !task.completed).length,
    overdue: filteredTasks.filter((task) => !task.completed && task.dueDate && new Date(task.dueDate) < new Date())
      .length,
  }

  // Handle login redirect
  const handleLogin = () => {
    router.push("/login")
  }

  // Show auth error if needed
  if (authError) {
    return (
      <div className="min-h-screen bg-blue-900 flex flex-col">
        <main className="container mx-auto px-4 pb-24 pt-16 flex-1 flex flex-col items-center justify-center">
          <div className="max-w-md w-full">
            <Alert variant="destructive" className="mb-6 bg-red-900/50 border-red-700 text-white">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error de autenticación</AlertTitle>
              <AlertDescription>Necesitas iniciar sesión para ver tus tareas.</AlertDescription>
            </Alert>

            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleLogin}>
              Iniciar sesión
            </Button>
          </div>
        </main>
        <NewNavbar />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-blue-300 animate-spin mx-auto mb-4" />
          <p className="text-blue-200">Cargando tareas...</p>
        </div>
        <NewNavbar />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-900">
      <main className="container mx-auto px-4 pb-24 pt-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-4 glow-text">Tareas</h1>

          {error && (
            <Alert variant="destructive" className="mb-6 bg-red-900/50 border-red-800 text-white">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Selector de Vista (Mis Tareas / Tareas de la Organización) */}
          {currentUser.role === "admin" && (
            <div className="flex items-center mb-8 bg-blue-800/30 border border-blue-700/30 rounded-lg p-4">
              <div className="flex items-center space-x-4">
                <div className="grid grid-cols-2 gap-2 w-full">
                  <Button
                    variant={viewMode === "my-tasks" ? "default" : "outline"}
                    className={
                      viewMode === "my-tasks"
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "border-blue-600/50 text-blue-300 hover:bg-blue-800/30"
                    }
                    onClick={() => setViewMode("my-tasks")}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Mis Tareas
                  </Button>
                  {/*<Button
                    variant={viewMode === "organization-tasks" ? "default" : "outline"}
                    className={
                      viewMode === "organization-tasks"
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "border-blue-600/50 text-blue-300 hover:bg-blue-800/30"
                    }
                    onClick={() => setViewMode("organization-tasks")}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Tareas de Miembros
                  </Button>
                  <Users className="h-4 w-4 mr-2" />
                    Tareas de la Organización
                  </Button>*/}
                </div>
              </div>
            </div>
          )}

          {/* Filtros: Barra de búsqueda, selector de reunión y botón de nueva tarea */}
          <div className="mb-8 flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-300" />
              <input
                type="text"
                placeholder="Buscar tareas..."
                className="pl-10 w-full bg-blue-800/30 border border-blue-700/30 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {/* Selector de reunión */}
              <div className="w-full sm:flex-1">
                <Select value={selectedMeeting} onValueChange={setSelectedMeeting}>
                  <SelectTrigger className="bg-blue-800/30 border-blue-700/30 text-white w-full">
                    <SelectValue placeholder="Filtrar por reunión" />
                  </SelectTrigger>
                  <SelectContent className="bg-blue-800 border-blue-700 text-white">
                    <SelectItem value="all">Todas las reuniones</SelectItem>
                    {meetings.map((meeting) => (
                      <SelectItem key={meeting.id} value={meeting.id.toString()}>
                        {meeting.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/*<Button
                className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                onClick={() => setShowNewTaskModal(true)}
              >
                <Plus className="h-5 w-5 mr-2" />
                Nueva tarea
              </Button>*/}
            </div>
          </div>

          {/* Pestañas de filtrado */}
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full mb-4">
            <div className="overflow-x-auto pb-2">
              <TabsList className="grid w-full min-w-[500px] grid-cols-4 bg-blue-800/30 gap-1 px-2 sm:px-4">
                <TabsTrigger value="all" className="data-[state=active]:bg-blue-600">
                  Todas ({taskCounts.all})
                </TabsTrigger>
                <TabsTrigger value="pending" className="data-[state=active]:bg-blue-600">
                  Pendientes ({taskCounts.pending})
                </TabsTrigger>
                <TabsTrigger value="completed" className="data-[state=active]:bg-blue-600">
                  Completadas ({taskCounts.completed})
                </TabsTrigger>
                <TabsTrigger value="overdue" className="data-[state=active]:bg-blue-600">
                  Vencidas ({taskCounts.overdue})
                </TabsTrigger>
              </TabsList>
            </div>
          </Tabs>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="md:w-1/3">
              <Card className="bg-blue-800/20 border-blue-700/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white">
                    {viewMode === "my-tasks" ? "Mis tareas" : "Tareas de miembros"}
                    {selectedMeeting !== "all" &&
                      meetings.find((m) => m.id.toString() === selectedMeeting) &&
                      ` - ${meetings.find((m) => m.id.toString() === selectedMeeting)?.title}`}
                  </CardTitle>
                  <CardDescription className="text-blue-200/70">
                    {viewMode === "my-tasks"
                      ? "Visualiza y gestiona todas tus tareas"
                      : "Visualiza y gestiona todas las tareas asignadas a miembros de la organización"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="max-h-[60vh] overflow-y-auto">
                  {filteredTasks.length > 0 ? (
                    filteredTasks.map((task) => (
                      <TaskSidebarItem
                        key={task.id}
                        task={task}
                        isSelected={selectedTask?.id === task.id}
                        onSelect={setSelectedTask}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 text-blue-300">No hay tareas disponibles</div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex-1">
              {selectedTask && (
                <Card className="bg-blue-800/20 border-blue-700/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white">Detalle de la tarea</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TaskDetails
                      task={selectedTask}
                      userRole={currentUser.role}
                      onToggleComplete={handleToggleComplete}
                      onEdit={handleEditTask}
                      onDelete={handleDeleteTask}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal para nueva tarea */}
      <Dialog open={showNewTaskModal} onOpenChange={setShowNewTaskModal}>
        <DialogContent className="bg-blue-800/90 border border-blue-700/50 p-0 max-w-md overflow-hidden">
          <DialogTitle className="sr-only">Nueva Tarea</DialogTitle>
          <NewTaskModal
            onCancel={() => setShowNewTaskModal(false)}
            onSave={handleCreateTask}
            currentUserName={userFullName}
            organizationMembers={organizationMembers}
            meetings={meetings}
          />
        </DialogContent>
      </Dialog>

      {/* Modal para editar tarea */}
      {currentTask && (
        <Dialog open={showEditTaskModal} onOpenChange={setShowEditTaskModal}>
          <DialogContent className="bg-blue-800/90 border border-blue-700/50 p-0 max-w-md max-h-[85vh] overflow-hidden">
            <DialogTitle className="sr-only">Editar Tarea</DialogTitle>
            <EditTaskModal
              task={currentTask}
              onCancel={() => {
                setShowEditTaskModal(false)
                setCurrentTask(null)
              }}
              onSave={handleUpdateTask}
              currentUser={currentUser}
              organizationMembers={organizationMembers}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Navbar */}
      <NewNavbar />
    </div>
  )
}
