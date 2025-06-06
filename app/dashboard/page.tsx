"use client"

import { useState, useEffect } from "react"
import { NewNavbar } from "@/components/new-navbar"
import {
  Search,
  Calendar,
  Clock,
  Users,
  X,
  FileText,
  CheckSquare,
  List,
  FileAudio,
  MessageSquare,
  Plus,
  Loader2,
  AlertCircle,
  Trash2,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { getSupabaseClient } from "@/utils/supabase"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getUsername, storeUsername } from "@/utils/user-helpers"
import { TemporaryAudioPlayer } from "@/components/temporary-audio-player"


// Función para contar hablantes únicos en una transcripción
const countUniqueParticipants = (transcription) => {
  if (!transcription || !Array.isArray(transcription) || transcription.length === 0) {
    return 0
  }
  
  // Crear un conjunto de hablantes únicos (ignorando valores nulos o vacíos)
  const uniqueSpeakers = new Set()

  transcription.forEach((item) => {
    if (item.speaker && item.speaker.trim() !== "") {
      uniqueSpeakers.add(item.speaker.trim())
    }
  })

  return uniqueSpeakers.size
}

// Component for conversation card
const ConversationCard = ({ conversation, onClick, onDeleteClick }) => {
  // Calcular el número de participantes basado en la transcripción
  const participantCount = conversation.transcription
    ? countUniqueParticipants(conversation.transcription)
    : conversation.participants || 0

  const handleDeleteClick = (e) => {
    e.stopPropagation() // Evitar que se propague al onClick de la tarjeta
    onDeleteClick(conversation)
  }

  return (
    <motion.div
      className="bg-blue-800/30 border border-blue-700/30 rounded-lg p-4 cursor-pointer hover:bg-blue-700/40 transition-all relative"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      <h3 className="text-lg font-medium text-white mb-2">{conversation.title}</h3>
      <div className="flex items-center text-blue-200/70 text-sm mb-2">
        <Calendar className="h-4 w-4 mr-1" />
        <span className="mr-3">{format(new Date(conversation.date), "dd MMM yyyy", { locale: es })}</span>
        <Clock className="h-4 w-4 mr-1" />
        <span>{conversation.duration || "00:00"}</span>
      </div>
      <div className="flex items-center text-blue-200/70 text-sm">
        <Users className="h-4 w-4 mr-1" />
        <span>
          {participantCount} {participantCount === 1 ? "participante" : "participantes"}
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-8 w-8 text-blue-300 hover:text-red-400 hover:bg-blue-800/50"
        onClick={handleDeleteClick}
        aria-label="Eliminar conversación"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </motion.div>
  )
}

// Component for detailed conversation view
const ConversationDetail = ({ conversation, onClose }) => {
  const [activeTab, setActiveTab] = useState("summary")
  const router = useRouter()
  const username = getUsername()
  const [editedTitle, setEditedTitle] = useState(conversation.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const handleSaveTitle = async () => {
    setIsSavingTitle(true);
    const response = await fetch(`/api/meetings/${conversation.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-Username": username,
      },
      body: JSON.stringify({ newTitle: editedTitle }),
    });
    setIsSavingTitle(false);
    setIsEditingTitle(false);

    if (response.ok) {
      // Actualiza el título localmente para que se refleje el cambio
      setEditedTitle(editedTitle);
      // Si tienes un estado de conversación, actualízalo también:
      conversation.title = editedTitle;

    }
  };

  const handleViewTranscription = (id: number) => {
      router.push(`/building-transcriptions?id=${id}&view=transcription-only`);
  };
  // Calcular el número de participantes basado en la transcripción
  const participantCount = conversation.transcription
    ? countUniqueParticipants(conversation.transcription)
    : conversation.participants || 0

  // Verificar si hay datos disponibles para cada sección
  const hasTranscription = conversation.transcription && conversation.transcription.length > 0
  const hasKeyPoints = conversation.keyPoints && conversation.keyPoints.length > 0
  const hasTasks = conversation.tasks && conversation.tasks.length > 0
  const hasSummary = conversation.summary && conversation.summary.trim() !== ""

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-blue-900/90 border border-blue-700/50 rounded-xl w-[95%] sm:w-full max-w-4xl max-h-[90vh] sm:max-h-[80vh] overflow-hidden"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        {/* Header */}
        <div className="p-6 border-b border-blue-700/30 flex justify-between items-center">
          <div>
           <div className="flex items-center gap-2">
              {isEditingTitle ? (
                <>
                  <input
                    className="text-2xl font-bold text-white bg-blue-800/30 border border-blue-700/30 rounded px-2 py-1"
                    value={editedTitle}
                    onChange={e => setEditedTitle(e.target.value)}
                    disabled={isSavingTitle}
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveTitle}
                    disabled={isSavingTitle || !editedTitle.trim()}
                  >
                    {isSavingTitle ? "Guardando..." : "Guardar"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsEditingTitle(false);
                      setEditedTitle(conversation.title);
                    }}
                    disabled={isSavingTitle}
                  >
                    Cancelar
                  </Button>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-white">{conversation.title}</h2>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditingTitle(true)}
                  >
                    Editar
                  </Button>
                </>
              )}
            </div>

            <div className="flex items-center text-blue-200/70 text-sm mt-1">
              <Calendar className="h-4 w-4 mr-1" />
              <span className="mr-3">{format(new Date(conversation.date), "dd MMM yyyy", { locale: es })}</span>
              <Clock className="h-4 w-4 mr-1" />
              <span className="mr-3">{conversation.duration || "00:00"}</span>
              <Users className="h-4 w-4 mr-1" />
              <span>
                {participantCount} {participantCount === 1 ? "participante" : "participantes"}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-blue-300 hover:text-white hover:bg-blue-800/50"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="summary" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-4 sm:px-6 pt-4 overflow-hidden">
            <div className="overflow-x-auto">
              <TabsList className="grid grid-cols-5 gap-1 bg-blue-800/30 w-full min-w-[500px]">
                <TabsTrigger value="summary" className="data-[state=active]:bg-blue-600 text-white text-xs">
                  <FileText className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Resumen</span>
                  <span className="sm:hidden">Res.</span>
                </TabsTrigger>
                <TabsTrigger value="key-points" className="data-[state=active]:bg-blue-600 text-white text-xs">
                  <List className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Puntos Clave</span>
                  <span className="sm:hidden">Puntos</span>
                </TabsTrigger>
                <TabsTrigger value="tasks" className="data-[state=active]:bg-blue-600 text-white text-xs">
                  <CheckSquare className="h-4 w-4 mr-1 sm:mr-2" />
                  <span>Tareas</span>
                </TabsTrigger>
                <TabsTrigger value="transcript" className="data-[state=active]:bg-blue-600 text-white text-xs">
                  <FileText className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Transcripción</span>
                  <span className="sm:hidden">Trans.</span>
                </TabsTrigger>
                <TabsTrigger value="audio" className="data-[state=active]:bg-blue-600 text-white text-xs">
                  <FileAudio className="h-4 w-4 mr-1 sm:mr-2" />
                  <span>Audio</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <TabsContent value="summary" className="mt-0">
              <div className="bg-blue-800/20 p-4 rounded-lg">
                {hasSummary ? (
                  <p className="text-blue-100">{conversation.summary}</p>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-blue-100">No hay resumen disponible para esta reunión.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="key-points" className="mt-0">
              <div className="bg-blue-800/20 p-4 rounded-lg">
                {hasKeyPoints ? (
                  <ul className="space-y-2">
                    {conversation.keyPoints.map((point, index) => (
                      <li key={index} className="flex items-start">
                        <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs flex-shrink-0 mr-3 mt-0.5">
                          {index + 1}
                        </div>
                        <span className="text-blue-100">{point.point_text}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-blue-100">No hay puntos clave disponibles para esta reunión.</p>
                  </div>
                )}
              </div>
            </TabsContent>

           <TabsContent value="tasks" className="mt-0">
              <div className="bg-blue-800/20 p-4 rounded-lg">
                {hasTasks ? (
                  <ul className="space-y-4">
                    {conversation.tasks.map((task) => (
                      <li key={task.id} className="flex items-start">
                        <div
                          className={`h-5 w-5 rounded border flex-shrink-0 mr-3 mt-0.5 flex items-center justify-center ${
                            task.completed ? "bg-green-500 border-green-600" : "border-blue-500"
                          }`}
                        >
                          {task.completed && <CheckSquare className="h-3 w-3 text-white" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">{task.text}</p>
                          {task.description && <p className="text-blue-200 text-sm mt-1">{task.description}</p>}
                          <div className="flex flex-wrap items-center text-sm text-blue-200/70 mt-2 gap-x-4 gap-y-1">
                            <span>
                              <span className="text-blue-300">Prioridad:</span>{" "}
                              <span
                                className={
                                  task.priority === "alta"
                                    ? "text-red-300"
                                    : task.priority === "media"
                                      ? "text-yellow-300"
                                      : "text-green-300"
                                }
                              >
                                {task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1) || "Normal"}
                              </span>
                            </span>
                            <span>
                              <span className="text-blue-300">Asignado a:</span> {task.assignee || "Sin asignar"}
                            </span>
                            {task.due_date && (
                              <span>
                                <span className="text-blue-300">Fecha límite:</span>{" "}
                                {format(new Date(task.due_date), "dd MMM yyyy", { locale: es })}
                              </span>
                            )}
                            <span>
                              <span className="text-blue-300">Progreso:</span> {task.progress || 0}%
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-blue-100">No hay tareas disponibles para esta reunión.</p>
                    <Button
                      variant="outline"
                      className="mt-4 border-blue-500 text-blue-300 hover:bg-blue-800/50"
                      onClick={() => router.push(`/tasks?meeting=${conversation.id}`)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Crear tarea para esta reunión
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="transcript" className="mt-0">
              <div className="bg-blue-800/20 p-4 rounded-lg">
                <Button
                  onClick={() => handleViewTranscription(conversation.id)}
                  className="bg-blue-600 hover:bg-blue-700 mb-4" // <-- Aquí el espacio
                >
                  Ver transcripción con Audio
                </Button>

                {hasTranscription ? (
                  <div className="space-y-6">
                    {conversation.transcription.map((item, index) => (
                      <div key={index} className="flex">
                        <div className="w-20 flex-shrink-0">
                          <div className="text-sm text-blue-300">{item.time || "--:--"}</div>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-white mb-1">{item.speaker || "Interlocutor"}</div>
                          <div className="text-blue-100">{item.text}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-blue-100">No hay transcripción disponible para esta reunión.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="audio" className="mt-0">
              <div className="bg-blue-800/20 p-4 rounded-lg">
                <TemporaryAudioPlayer
                  meetingId={conversation.id}
                  username={username}
                  onClose={() => setSelectedConversation(null)}
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </motion.div>
    </motion.div>
  )
}

const DeleteConfirmationModal = ({ conversation, onConfirm, onCancel }) => {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-blue-900/90 border border-blue-700/50 rounded-xl w-full max-w-md overflow-hidden"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        <div className="p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center">
              <Trash2 className="h-6 w-6 text-red-400" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-white text-center mb-2">Eliminar Conversación</h2>
          <p className="text-blue-200 text-center mb-6">
            ¿Estás seguro de que deseas eliminar "{conversation.title}"? Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-blue-600/50 text-blue-300 hover:bg-blue-800/50"
              onClick={onCancel}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="flex-1 bg-red-600 hover:bg-red-700"
              onClick={() => onConfirm(conversation.id)}
            >
              Eliminar
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Loading overlay component
const LoadingOverlay = () => (
  <motion.div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <div className="text-center">
      <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-solid border-blue-400 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
      <p className="mt-4 text-xl text-white">Cargando Conversación...</p>
    </div>
  </motion.div>
)

// Usage indicator component
const UsageIndicator = () => {
  const [usage, setUsage] = useState({ used: 0, limit: 5, remaining: 5 })
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const username = getUsername()

  useEffect(() => {
    const fetchUsage = async () => {
      if (!username) {
        setError(true)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await fetch("/api/user/usage", {
          headers: {
            "X-Username": username,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch usage data")
        }

        const data = await response.json()
        setUsage(data)
        setError(false)
      } catch (err) {
        console.error("Error fetching usage data:", err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchUsage()
  }, [username])

  if (loading) {
    return (
      <div className="bg-blue-800/30 border border-blue-700/30 rounded-lg p-3">
        <div className="flex items-center justify-center">
          <Loader2 className="h-4 w-4 text-blue-300 animate-spin mr-2" />
          <span className="text-blue-200 text-sm">Cargando datos de uso...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-blue-800/30 border border-blue-700/30 rounded-lg p-3">
        <div className="flex items-center">
          <div className="w-full">
            <div className="flex items-center justify-between mb-1">
              <span className="text-blue-200 text-sm">Análisis mensuales</span>
              <span className="text-blue-200 text-sm">Desconocido</span>
            </div>
            <div className="h-2 bg-blue-700/50 rounded-full overflow-hidden">
              <div className="h-full bg-blue-400 w-0 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const percentage = (usage.used / usage.limit) * 100
  const indicatorColor = percentage > 80 ? "bg-red-400" : "bg-blue-400"

  return (
    <div className="bg-blue-800/30 border border-blue-700/30 rounded-lg p-3">
      <div className="flex items-center">
        <div className="w-full">
          <div className="flex items-center justify-between mb-1">
            <span className="text-blue-200 text-sm">Análisis mensuales</span>
            <span className="text-blue-200 text-sm">{usage.remaining} restantes</span>
          </div>
          <div className="h-2 bg-blue-700/50 rounded-full overflow-hidden">
            <div className={`h-full ${indicatorColor} rounded-full`} style={{ width: `${percentage}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadingConversation, setLoadingConversation] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [conversations, setConversations] = useState([])
  const [authError, setAuthError] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const router = useRouter()

  const conversationsPerPage = 20 // 5x4 grid

  const [conversationToDelete, setConversationToDelete] = useState(null)
  const [deletingConversation, setDeletingConversation] = useState(false)


   // 1. Checa autenticación y obtiene username
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Primero intenta obtener el username de localStorage
        const storedUsername = getUsername();
        if (storedUsername) {
          setUsername(storedUsername);
          setAuthError(false);
          return;
        }

        // Si no hay username en localStorage, intenta obtenerlo de Supabase
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.auth.getSession();

        if (error || !data.session) {
          console.error("Auth error:", error);
          setAuthError(true);
          return;
        }

        // Obtiene el username del perfil
        const { data: profileData } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", data.session.user.id)
          .single();

        if (profileData?.username) {
          storeUsername(profileData.username);
          setUsername(profileData.username);
          setAuthError(false);
        } else {
          setAuthError(true);
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        setAuthError(true);
      }
    };

    checkAuth();
  }, []);

  // 2. Define fetchConversations fuera del useEffect
  const fetchConversations = async (usernameToUse?: string) => {
    const user = usernameToUse ?? username;
    console.log("fetchConversations user:", user);
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch("/api/meetings", {
        headers: {
          "X-Username": user,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setAuthError(true);
          return;
        }
        throw new Error("Failed to fetch conversations");
      }

      const data = await response.json();

      // Procesar los datos para contar participantes
      const processedData = await Promise.all(
        data.map(async (conversation) => {
          if (conversation.transcription && Array.isArray(conversation.transcription)) {
            const participantCount = countUniqueParticipants(conversation.transcription);
            return { ...conversation, participants: participantCount };
          }
          if (conversation.id && !conversation.transcription) {
            try {
              const detailResponse = await fetch(`/api/meetings/${conversation.id}/transcription`, {
                headers: {
                  "X-Username": user,
                },
              });

              if (detailResponse.ok) {
                const transcriptionData = await detailResponse.json();
                if (transcriptionData && Array.isArray(transcriptionData)) {
                  const participantCount = countUniqueParticipants(transcriptionData);
                  return { ...conversation, participants: participantCount };
                }
              }
            } catch (error) {
              console.error(`Error fetching transcription for meeting ${conversation.id}:`, error);
            }
          }
          return conversation;
        }),
      );

      setConversations(processedData);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Llama a fetchConversations en useEffect cuando cambie username
  useEffect(() => {
    console.log("username en useEffect:", username);
    fetchConversations();
  }, [username]);
  // Filter conversations by search term
  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Calculate total pages
  const totalPages = Math.ceil(filteredConversations.length / conversationsPerPage)

  // Get conversations for current page
  const currentConversations = filteredConversations.slice(
    (currentPage - 1) * conversationsPerPage,
    currentPage * conversationsPerPage,
  )

  // Handle conversation selection
  const handleSelectConversation = async (conversation) => {
    if (!username) return

    setLoadingConversation(true)

    try {
      // Fetch full conversation details
      const response = await fetch(`/api/meetings/${conversation.id}`, {
        headers: {
          "X-Username": username,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch conversation details")
      }

      const detailedConversation = await response.json()

      // Contar participantes basados en la transcripción
      if (detailedConversation.transcription && Array.isArray(detailedConversation.transcription)) {
        const participantCount = countUniqueParticipants(detailedConversation.transcription)
        detailedConversation.participants = participantCount
      }

      // Añadir el nombre de usuario para usarlo en las peticiones
      detailedConversation.username = username

      setSelectedConversation(detailedConversation)
    } catch (error) {
      console.error("Error fetching conversation details:", error)
      // Use the basic conversation data we already have
      setSelectedConversation({ ...conversation, username })
    } finally {
      setLoadingConversation(false)
    }
  }

  const handleDeleteConversation = async (conversationId) => {
    if (!username) return

    try {
      setDeletingConversation(true)

      const response = await fetch(`/api/meetings/${conversationId}`, {
        method: "DELETE",
        headers: {
          "X-Username": username,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete conversation")
      }

      // Actualizar la lista de conversaciones
      setConversations(conversations.filter((conv) => conv.id !== conversationId))
      setConversationToDelete(null)
    } catch (error) {
      console.error("Error deleting conversation:", error)
      // Aquí podrías mostrar un mensaje de error
    } finally {
      setDeletingConversation(false)
    }
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
              <AlertTitle>Error de Autenticación</AlertTitle>
              <AlertDescription>Necesitas estar registrado para ver tus conversaciones.</AlertDescription>
            </Alert>

            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleLogin}>
              Iniciar Sesión
            </Button>
          </div>
        </main>
        <NewNavbar />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-900">
      <main className="container mx-auto px-4 pb-24 pt-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-4 md:mb-0 glow-text">Mis Conversaciones</h1>

            {/* Usage indicator */}
            <div className="w-full md:w-64">
              <UsageIndicator />
            </div>
          </div>

          {/* Search bar */}
          <div className="mb-8 w-full max-w-full sm:max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-300" />
              <input
                type="text"
                placeholder="Buscar conversaciones..."
                className="pl-10 w-full bg-blue-800/30 border border-blue-700/30 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1) // Reset to first page when searching
                }}
              />
            </div>
          </div>

          {/* Conversations grid */}
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
              <span className="ml-3 text-blue-200">Cargando Conversaciones...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 mb-8">
              {currentConversations.length > 0 ? (
                currentConversations.map((conversation) => (
                  <ConversationCard
                    key={conversation.id}
                    conversation={conversation}
                    onClick={() => handleSelectConversation(conversation)}
                    onDeleteClick={(conv) => setConversationToDelete(conv)}
                  />
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-blue-800/40 p-4 mb-4">
                    <MessageSquare className="h-10 w-10 text-blue-300" />
                  </div>
                  <h3 className="text-xl font-medium text-white mb-2">No hay conversaciones</h3>
                  <p className="text-blue-300/70 max-w-md">
                    Las conversaciones y transcripciones de tus reuniones aparecerán aquí cuando las crees.
                  </p>
                  <Button className="mt-4 bg-blue-600 hover:bg-blue-700" onClick={() => router.push("/new-meeting")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva reunión
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && currentConversations.length > 0 && (
            <div className="flex justify-center mt-8">
              <div className="flex flex-wrap gap-2 justify-center">
                <Button
                  variant="outline"
                  className="border-blue-600/50 text-blue-300 hover:bg-blue-800/30"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>

                <div className="flex items-center px-4 bg-blue-800/30 rounded-md text-white">
                  Página {currentPage} de {totalPages}
                </div>

                <Button
                  variant="outline"
                  className="border-blue-600/50 text-blue-300 hover:bg-blue-800/30"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {conversationToDelete && (
          <DeleteConfirmationModal
            conversation={conversationToDelete}
            onConfirm={handleDeleteConversation}
            onCancel={() => setConversationToDelete(null)}
          />
        )}
      </AnimatePresence>

      {/* Loading overlay for delete operation */}
      <AnimatePresence>
        {deletingConversation && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center">
              <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-solid border-blue-400 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
              <p className="mt-4 text-xl text-white">Eliminando conversación...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading modal */}
      <AnimatePresence>{loadingConversation && <LoadingOverlay />}</AnimatePresence>

      {/* Conversation detail modal */}
      <AnimatePresence>
        {selectedConversation && !loadingConversation && (
          <ConversationDetail conversation={selectedConversation} onClose={() => {
            setSelectedConversation(null)
            fetchConversations()}} />
        )}
      </AnimatePresence>

      {/* Navbar */}
      <NewNavbar />
    </div>
  )
}
export async function DELETE(request: Request, { params }: { params: any }) {
  const { id } = await params;
  const meetingId = id;
  try {
    // 1. Obtén el username del request
    const username = await getUsernameFromRequest(request);
    if (!username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Obtén la info actual de la reunión
    const [meeting] = await query("SELECT * FROM meetings WHERE id = ?", [meetingId]);
    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }
    const oldTitle = meeting.title;

    // 3. Obtén el folderId de la carpeta de Drive del usuario
    const folderResult = await query(
      "SELECT recordings_folder_id FROM google_tokens WHERE username = ? AND recordings_folder_id IS NOT NULL",
      [username]
    );
    if (!folderResult || folderResult.length === 0) {
      return NextResponse.json({ error: "No recordings folder found for user" }, { status: 404 });
    }
    const userFolderId = folderResult[0].recordings_folder_id;

    // 4. Funciones de limpieza de nombre
    function cleanTitleNoAccents(title: string): string {
      return title
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "");
    }
    function cleanTitleWithUnderscores(title: string): string {
      return title
        .replace(/[áÁàÀäÄâÂãÃåÅ]/g, "_")
        .replace(/[éÉèÈëËêÊ]/g, "_")
        .replace(/[íÍìÌïÏîÎ]/g, "_")
        .replace(/[óÓòÒöÖôÔõÕøØ]/g, "_")
        .replace(/[úÚùÙüÜûÛ]/g, "_")
        .replace(/[ñÑ]/g, "_")
        .replace(/[^a-zA-Z0-9]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "");
    }

    const oldFileNameNoAccents = `${meetingId}_${cleanTitleNoAccents(oldTitle)}.aac`;
    const oldFileNameWithUnderscores = `${meetingId}_${cleanTitleWithUnderscores(oldTitle)}.aac`;

    // 5. Autenticación Google Drive
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL,
      key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/drive"],
    });

    const drive = google.drive({ version: "v3", auth });

    // 6. Buscar el archivo en Drive (primero sin acentos)
    let response = await drive.files.list({
      q: `name = '${oldFileNameNoAccents}' and '${userFolderId}' in parents and trashed = false`,
      fields: "files(id, name)",
    });

    if (!response.data.files || response.data.files.length !== 1) {
      // Si no lo encuentra, busca con guiones bajos
      response = await drive.files.list({
        q: `name = '${oldFileNameWithUnderscores}' and '${userFolderId}' in parents and trashed = false`,
        fields: "files(id, name)",
      });
    }

    // 7. Si lo encuentra, elimina el archivo de Drive
    if (response.data.files && response.data.files.length === 1) {
      const fileId = response.data.files[0].id;
      await drive.files.delete({ fileId });
      console.log("Archivo de Drive eliminado:", response.data.files[0].name);
    } else {
      console.warn("No se encontró archivo de Drive para eliminar.");
    }

    // 8. Elimina la conversación de la base de datos
    await query("DELETE FROM meetings WHERE id = ?", [meetingId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en DELETE /api/meetings/[id]:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
