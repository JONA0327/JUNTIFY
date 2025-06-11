"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { X, Send, ArrowLeft, Loader2, ListFilter } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { addUsernameToHeaders } from "@/utils/user-helpers"
import { getUsername } from "@/utils/user-helpers"
import { useDevice } from "@/hooks/use-device"

// Tipos para los mensajes
type MessageRole = "user" | "assistant" | "system"

interface ChatMessage {
  role: MessageRole
  content: string
}

// Tipo para el mapa de conversaciones
interface ConversationsMap {
  [meetingId: string]: ChatMessage[]
}

export const AIChatModal = ({ meeting, onClose }) => {
  const [activeTab, setActiveTab] = useState("chat")
  const [conversations, setConversations] = useState<ConversationsMap>({})
  const [inputValue, setInputValue] = useState("")
  const [isSearchingWeb, setIsSearchingWeb] = useState(false)
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const messagesEndRef = useRef(null)
  const [meetingDetails, setMeetingDetails] = useState(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(true)
  const [isOpenAIConfigured, setIsOpenAIConfigured] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(true)
  const [showMeetingSelector, setShowMeetingSelector] = useState(false)
  const [availableMeetings, setAvailableMeetings] = useState([])
  const [isLoadingMeetings, setIsLoadingMeetings] = useState(false)
  const [showContainerSelector, setShowContainerSelector] = useState(false)
  const [availableContainers, setAvailableContainers] = useState([])
  const [isLoadingContainers, setIsLoadingContainers] = useState(false)
  const [selectedContainerId, setSelectedContainerId] = useState<number | null>(null)
  const [selectedMeeting, setSelectedMeeting] = useState(meeting)
  const modalRef = useRef(null)
  const chatContainerRef = useRef(null)
  const { isMobile } = useDevice()

  const conversationKey = selectedContainerId
    ? `container-${selectedContainerId}`
    : selectedMeeting?.id

  // Inicializar las conversaciones al montar el componente
  useEffect(() => {
    const username = getUsername()
    if (!username) {
      setIsAuthenticated(false)
      // Inicializar con mensaje de error de autenticación
      setConversations({
        [conversationKey as string]: [
          {
            role: "assistant",
            content: "⚠️ Error de autenticación: No hay sesión activa. Por favor, inicia sesión de nuevo.",
          },
        ],
      })
    } else {
      // Inicializar con mensaje de bienvenida solo si está autenticado
      const welcomeMessage = {
        role: "assistant" as MessageRole,
        content: `Hola, soy tu asistente IA para reuniones. Ahora tengo acceso completo a toda la información de esta reunión, incluyendo:

• La transcripción completa
• El resumen de la reunión
• Los puntos clave identificados
• Las tareas asignadas

Puedo ayudarte con preguntas como:

• ¿Cuáles fueron los principales temas discutidos?
• ¿Qué dijo [nombre del participante] sobre [tema específico]?
• Resume la discusión sobre [tema específico]
• ¿Qué tareas se asignaron a [nombre]?
• ¿Cuáles son los puntos más importantes de la reunión?
• ¿Qué decisiones se tomaron sobre [tema]?

¿En qué puedo ayudarte hoy?`,
      }

      setConversations({
        [conversationKey as string]: [welcomeMessage],
      })
    }
  }, [])

  // Asegurar que el modal se desplace al inicio cuando se abre
  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.scrollTop = 0
    }
  }, [])

  // Cargar las reuniones disponibles
  useEffect(() => {
    const fetchAvailableMeetings = async () => {
      setIsLoadingMeetings(true)
      try {
        const response = await fetch("/api/meetings", {
          headers: addUsernameToHeaders(),
        })

        if (!response.ok) throw new Error("Error al cargar las reuniones")

        const data = await response.json()
        setAvailableMeetings(data)
      } catch (error) {
        console.error("Error al cargar las reuniones:", error)
      } finally {
        setIsLoadingMeetings(false)
      }
    }

    fetchAvailableMeetings()
  }, [])

  // Cargar los contenedores disponibles
  useEffect(() => {
    const fetchContainers = async () => {
      setIsLoadingContainers(true)
      try {
        const res = await fetch("/api/containers", {
          headers: addUsernameToHeaders(),
        })
        if (!res.ok) throw new Error("Error al cargar los contenedores")
        const data = await res.json()
        setAvailableContainers(data)
      } catch (err) {
        console.error("Error al cargar los contenedores", err)
      } finally {
        setIsLoadingContainers(false)
      }
    }
    fetchContainers()
  }, [])

  // Función para cambiar a otra reunión
  const handleChangeMeeting = (newMeeting) => {
    setSelectedContainerId(null)
    setSelectedMeeting(newMeeting)
    setMeetingDetails(null)
    setIsLoadingDetails(true)

    // Si no hay conversación para esta reunión, inicializar con mensaje de bienvenida
    if (!conversations[newMeeting.id]) {
      setConversations((prev) => ({
        ...prev,
        [newMeeting.id]: [
          {
            role: "assistant",
            content: `Hola, soy tu asistente IA para reuniones. Ahora tengo acceso completo a toda la información de esta reunión, incluyendo:

• La transcripción completa
• El resumen de la reunión
• Los puntos clave identificados
• Las tareas asignadas

Puedo ayudarte con preguntas como:

• ¿Cuáles fueron los principales temas discutidos?
• ¿Qué dijo [nombre del participante] sobre [tema específico]?
• Resume la discusión sobre [tema específico]
• ¿Qué tareas se asignaron a [nombre]?
• ¿Cuáles son los puntos más importantes de la reunión?
• ¿Qué decisiones se tomaron sobre [tema]?

¿En qué puedo ayudarte hoy?`,
          },
        ],
      }))
    }

    setShowMeetingSelector(false)
  }

  const handleSelectContainer = (container) => {
    setSelectedContainerId(container.id)
    setSelectedMeeting(null)
    setMeetingDetails(null)
    setIsLoadingDetails(false)

    if (!conversations[`container-${container.id}`]) {
      setConversations((prev) => ({
        ...prev,
        [`container-${container.id}`]: [
          {
            role: "assistant",
            content:
              "Hola, soy tu asistente IA para reuniones. Ahora tengo acceso completo a las reuniones de este contenedor.",
          },
        ],
      }))
    }

    setShowContainerSelector(false)
  }

  // Cargar los detalles de la reunión
  useEffect(() => {
    const fetchMeetingDetails = async () => {
      if (!selectedMeeting || selectedContainerId) return
      if (!selectedMeeting.id) return

      setIsLoadingDetails(true)
      try {
        const response = await fetch(`/api/meetings/${selectedMeeting.id}`, {
          headers: addUsernameToHeaders(),
        })

        if (!response.ok) throw new Error("Error al cargar los detalles de la reunión")

        const data = await response.json()
        setMeetingDetails(data)
      } catch (error) {
        console.error("Error al cargar los detalles de la reunión:", error)
      } finally {
        setIsLoadingDetails(false)
      }
    }

    selectedMeeting && !selectedContainerId && fetchMeetingDetails()
  }, [selectedMeeting, selectedContainerId])

  // Verificar la configuración de OpenAI
  useEffect(() => {
    const checkOpenAIConfig = async () => {
      try {
        const response = await fetch("/api/openai-check", {
          headers: addUsernameToHeaders(),
        })

        if (!response.ok) {
          throw new Error("Error al verificar la configuración de OpenAI")
        }

        const data = await response.json()
        setIsOpenAIConfigured(data.isConfigured)

        if (!data.isConfigured && conversationKey) {
          // Añadir mensaje de advertencia a la conversación actual
          setConversations((prev) => {
            const currentMsgs = prev[conversationKey] || []
            return {
              ...prev,
              [conversationKey]: [
                ...currentMsgs,
                {
                  role: "assistant",
                  content: `⚠️ Advertencia: ${data.error || "La API de OpenAI no está configurada correctamente. El chat podría no funcionar."}`,
                },
              ],
            }
          })
        }
      } catch (error) {
        console.error("Error al verificar la configuración de OpenAI:", error)
        setIsOpenAIConfigured(false)
      }
    }

    checkOpenAIConfig()
  }, [selectedMeeting?.id, selectedContainerId])

  // Función para enviar un mensaje a la API de chat
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isSendingMessage || !conversationKey) return

    // Obtener los mensajes actuales para la conversación actual
    const currentMessages = conversations[conversationKey] || []

    // Añadir mensaje del usuario a la conversación actual
    const userMessage: ChatMessage = { role: "user", content: inputValue }
    setConversations((prev) => {
      const currentMsgs = prev[conversationKey] || []
      return {
        ...prev,
        [conversationKey]: [...currentMsgs, userMessage],
      }
    })

    setInputValue("")
    setIsSendingMessage(true)

    try {
      // Verificar que haya un nombre de usuario antes de enviar el mensaje
      const headers = addUsernameToHeaders({
        "Content-Type": "application/json",
      })

      // Verificar si el objeto headers contiene el encabezado X-Username
      const headersObj = headers instanceof Headers ? headers : new Headers(headers)
      if (!headersObj.has("X-Username")) {
        throw new Error("No hay usuario autenticado. Por favor, inicia sesión de nuevo.")
      }

      // Preparar los mensajes para enviar a la API (solo los últimos 10 para mantener el contexto manejable)
      const recentMessages = [...currentMessages.slice(-10), userMessage]

      // Llamar a la API de chat
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          messages: recentMessages.map((msg) => ({ role: msg.role, content: msg.content })),
          meetingId: selectedContainerId ? undefined : selectedMeeting?.id,
          containerId: selectedContainerId ?? undefined,
          searchWeb: isSearchingWeb,
        }),
      })

      // Check for authentication errors specifically
      if (response.status === 401) {
        throw new Error(
          "Error de autenticación: Sesión expirada o usuario no autorizado. Por favor, inicia sesión de nuevo.",
        )
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Error response:", response.status, errorData)
        throw new Error(`Error ${response.status}: ${errorData.error || response.statusText}`)
      }

      const data = await response.json()

      // Añadir la respuesta de la IA a la conversación actual
      setConversations((prev) => {
        const currentMsgs = prev[conversationKey] || []
        return {
          ...prev,
          [conversationKey]: [...currentMsgs, { role: "assistant", content: data.response }],
        }
      })
    } catch (error) {
      console.error("Error al enviar mensaje:", error)
      // Añadir mensaje de error a la conversación actual
      setConversations((prev) => {
        const currentMsgs = prev[conversationKey] || []
        return {
          ...prev,
          [conversationKey]: [
            ...currentMsgs,
            {
              role: "assistant",
              content: `Lo siento, ha ocurrido un error al procesar tu mensaje: ${error.message || "Error desconocido"}. Por favor, inténtalo de nuevo.`,
            },
          ],
        }
      })
    } finally {
      setIsSendingMessage(false)
    }
  }, [inputValue, conversations, conversationKey, isSearchingWeb, isSendingMessage])

  // Scroll al último mensaje cuando se añade uno nuevo
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [conversations, conversationKey])

  // Obtener los mensajes actuales para la reunión seleccionada
  const currentMessages = conversationKey ? conversations[conversationKey] || [] : []

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 overflow-hidden bg-black/80"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        ref={modalRef}
        className="relative w-full h-full sm:h-[90vh] sm:max-w-4xl sm:rounded-lg flex flex-col bg-blue-900 overflow-y-auto"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        {/* Header - Fijado en la parte superior */}
        <div className="sticky top-0 z-30 border-b border-blue-800 bg-blue-900">
          {/* Título y fecha en móvil - centrados */}
          <div className="flex flex-col items-center sm:items-start p-3 sm:hidden">
            <h2 className="text-lg font-semibold text-white">
              {selectedMeeting ? selectedMeeting.title : `Contenedor ${selectedContainerId}`}
            </h2>
            {selectedMeeting && (
              <div className="text-blue-200/70 text-sm mt-1">
                {selectedMeeting.date
                  ? format(new Date(selectedMeeting.date), "dd/MM/yyyy HH:mm", { locale: es })
                  : "Fecha desconocida"}
              </div>
            )}
          </div>

          {/* Versión desktop del header */}
          <div className="hidden sm:flex flex-row items-center justify-between p-4">
            <div className="flex flex-col">
              <h2 className="text-xl font-semibold text-white">
                {selectedMeeting ? selectedMeeting.title : `Contenedor ${selectedContainerId}`}
              </h2>
              {selectedMeeting && (
                <div className="text-blue-200/70 text-sm mt-1">
                  {selectedMeeting.date
                    ? format(new Date(selectedMeeting.date), "dd/MM/yyyy HH:mm", { locale: es })
                    : "Fecha desconocida"}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-blue-300 border-blue-700/50 text-sm"
                onClick={() => setShowMeetingSelector(!showMeetingSelector)}
              >
                <ListFilter className="h-4 w-4 mr-1" />
                Cambiar reunión
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-blue-300 border-blue-700/50 text-sm"
                onClick={() => setShowContainerSelector(!showContainerSelector)}
              >
                Contenedores
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-blue-300 border-blue-700/50 text-sm"
                onClick={onClose}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Volver
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-blue-300 hover:text-white hover:bg-blue-800/50"
                onClick={onClose}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Botones en móvil - fila separada */}
          <div className="flex justify-center gap-2 p-2 sm:hidden">
            <Button
              variant="outline"
              size="sm"
              className="text-blue-300 border-blue-700/50 text-xs"
              onClick={() => setShowMeetingSelector(!showMeetingSelector)}
            >
              <ListFilter className="h-3 w-3 mr-1" />
              Cambiar reunión
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-blue-300 border-blue-700/50 text-xs"
              onClick={() => setShowContainerSelector(!showContainerSelector)}
            >
              Contenedores
            </Button>
            <Button variant="outline" size="sm" className="text-blue-300 border-blue-700/50 text-xs" onClick={onClose}>
              <ArrowLeft className="h-3 w-3 mr-1" />
              Volver
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-blue-300 hover:text-white hover:bg-blue-800/50 h-8 w-8"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Selector de reuniones - Rediseñado como modal */}
        {showMeetingSelector && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
            <div className="bg-blue-800 border border-blue-700 rounded-lg shadow-lg w-[90%] max-w-md max-h-[80vh] overflow-hidden">
              <div className="p-3 sticky top-0 bg-blue-800/95 backdrop-blur-sm border-b border-blue-700/30 flex justify-between items-center">
                <h3 className="text-white font-medium">Seleccionar otra reunión</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-300 hover:text-white"
                  onClick={() => setShowMeetingSelector(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="overflow-y-auto max-h-[60vh]">
                {isLoadingMeetings ? (
                  <div className="flex justify-center items-center p-4">
                    <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
                  </div>
                ) : (
                  <div className="p-3">
                    {availableMeetings.map((availableMeeting) => (
                      <div
                        key={availableMeeting.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors mb-2 ${
                          availableMeeting.id === selectedMeeting?.id
                            ? "bg-blue-600 border border-blue-500"
                            : "hover:bg-blue-700/60 bg-blue-800/60 border border-blue-700/30"
                        }`}
                        onClick={() => handleChangeMeeting(availableMeeting)}
                      >
                        <div className="font-medium text-white">{availableMeeting.title}</div>
                        <div className="text-sm text-blue-200/70 mt-1">
                          {availableMeeting.date
                            ? format(new Date(availableMeeting.date), "dd/MM/yyyy HH:mm", { locale: es })
                            : "Fecha desconocida"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-3 border-t border-blue-700/30 bg-blue-800/95">
                <Button className="w-full" variant="outline" onClick={() => setShowMeetingSelector(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Selector de contenedores */}
        {showContainerSelector && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
            <div className="bg-blue-800 border border-blue-700 rounded-lg shadow-lg w-[90%] max-w-md max-h-[80vh] overflow-hidden">
              <div className="p-3 sticky top-0 bg-blue-800/95 backdrop-blur-sm border-b border-blue-700/30 flex justify-between items-center">
                <h3 className="text-white font-medium">Seleccionar contenedor</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-300 hover:text-white"
                  onClick={() => setShowContainerSelector(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="overflow-y-auto max-h-[60vh]">
                {isLoadingContainers ? (
                  <div className="flex justify-center items-center p-4">
                    <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
                  </div>
                ) : (
                  <div className="p-3">
                    {availableContainers.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 rounded-lg cursor-pointer transition-colors mb-2 hover:bg-blue-700/60 bg-blue-800/60 border border-blue-700/30"
                        onClick={() => handleSelectContainer(c)}
                      >
                        <div className="font-medium text-white">{c.name}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-3 border-t border-blue-700/30 bg-blue-800/95">
                <Button className="w-full" variant="outline" onClick={() => setShowContainerSelector(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs - Diseño mejorado */}
        <Tabs
          defaultValue="chat"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full flex-1 flex flex-col"
        >
          <div className="sticky top-[108px] sm:top-[88px] z-20 px-2 sm:px-4 pt-2 border-b border-blue-700/30 bg-blue-900">
            <TabsList className="bg-blue-800/30 w-full grid grid-cols-4 gap-1 p-1">
              <TabsTrigger
                value="chat"
                className="data-[state=active]:bg-blue-600 text-white text-xs whitespace-nowrap"
              >
                Chat con IA
              </TabsTrigger>
              <TabsTrigger
                value="summary"
                className="data-[state=active]:bg-blue-600 text-white text-xs whitespace-nowrap"
              >
                Resumen
              </TabsTrigger>
              <TabsTrigger
                value="key-points"
                className="data-[state=active]:bg-blue-600 text-white text-xs whitespace-nowrap"
              >
                Puntos Clave
              </TabsTrigger>
              <TabsTrigger
                value="tasks"
                className="data-[state=active]:bg-blue-600 text-white text-xs whitespace-nowrap"
              >
                Tareas
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 flex flex-col">
            <TabsContent value="chat" className="m-0 p-0 flex-1 flex flex-col h-full relative">
              <div className="p-3 sm:p-4 border-b border-blue-700/30">
                <div className="flex items-center">
                  <Checkbox
                    id="search-web"
                    checked={isSearchingWeb}
                    onCheckedChange={() => setIsSearchingWeb(!isSearchingWeb)}
                    className="border-blue-500 data-[state=checked]:bg-blue-600"
                  />
                  <label htmlFor="search-web" className="ml-2 text-sm text-blue-200">
                    Buscar información complementaria en internet (usando Google)
                  </label>
                </div>
                <div className="mt-2 p-2 bg-blue-600/20 border border-blue-500/30 rounded text-sm text-blue-100">
                  💡 El asistente ahora tiene acceso completo a toda la información de la reunión: transcripción,
                  resumen, puntos clave y tareas.
                </div>
              </div>

              {/* Chat messages - Ajustado para móvil */}
              <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-3 sm:p-4 pb-24 sm:pb-16">
                <div className="space-y-4">
                  {currentMessages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] p-2 sm:p-3 rounded-lg text-sm sm:text-base ${
                          message.role === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-blue-700/40 border border-blue-600/30 text-blue-100"
                        }`}
                      >
                        {message.role === "assistant" ? (
                          <div className="whitespace-pre-wrap">{message.content}</div>
                        ) : (
                          <p>{message.content}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {isSendingMessage && (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] p-2 sm:p-3 rounded-lg text-sm sm:text-base bg-blue-700/40 border border-blue-600/30 text-blue-100">
                        <div className="flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Pensando...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input area - Posicionado específicamente para móvil */}
              <div className="sm:absolute sm:bottom-0 sm:left-0 sm:right-0 sm:p-4 sm:border-t sm:border-blue-700/30 sm:bg-blue-800/95 sm:backdrop-blur-sm sm:z-50">
                {!isOpenAIConfigured && (
                  <div className="mb-3 p-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-200 text-sm">
                    ⚠️ La API de OpenAI no está configurada correctamente. El chat podría no funcionar.
                  </div>
                )}

                {/* Versión móvil del campo de entrada - Posicionado en el área marcada */}
                <div className="sm:hidden fixed bottom-[56px] left-0 right-0 p-3 bg-blue-800 border-t border-blue-700 z-50">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Escribe tu pregunta aquí..."
                      className="flex-1 bg-blue-700/40 border border-blue-600/50 text-white rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") handleSendMessage()
                      }}
                      disabled={isSendingMessage || !isOpenAIConfigured}
                    />
                    <Button
                      className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white h-10 w-10 flex items-center justify-center flex-shrink-0"
                      onClick={handleSendMessage}
                      disabled={isSendingMessage || !inputValue.trim() || !isOpenAIConfigured}
                    >
                      {isSendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      <span className="sr-only">Enviar</span>
                    </Button>
                  </div>
                </div>

                {/* Versión desktop del campo de entrada */}
                <div className="hidden sm:flex items-center gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Escribe tu pregunta aquí..."
                    className="flex-1 bg-blue-700/40 border border-blue-600/50 text-white rounded-lg p-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") handleSendMessage()
                    }}
                    disabled={isSendingMessage || !isOpenAIConfigured}
                  />
                  <Button
                    className="p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white h-12 w-12 flex items-center justify-center flex-shrink-0"
                    onClick={handleSendMessage}
                    disabled={isSendingMessage || !inputValue.trim() || !isOpenAIConfigured}
                  >
                    {isSendingMessage ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    <span className="sr-only">Enviar</span>
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="summary" className="m-0 p-4 overflow-y-auto h-full">
              {isLoadingDetails ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
                </div>
              ) : (
                <div className="bg-blue-800/20 p-4 rounded-lg">
                  <h3 className="text-xl font-medium text-white mb-4">Resumen de la reunión</h3>
                  <p className="text-blue-100 whitespace-pre-wrap">
                    {meetingDetails?.summary || "No hay resumen disponible para esta reunión."}
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="key-points" className="m-0 p-4 overflow-y-auto h-full">
              {isLoadingDetails ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
                </div>
              ) : (
                <div className="bg-blue-800/20 p-4 rounded-lg">
                  <h3 className="text-xl font-medium text-white mb-4">Puntos clave</h3>
                  {meetingDetails?.keyPoints && meetingDetails.keyPoints.length > 0 ? (
                    <ul className="space-y-3">
                      {meetingDetails.keyPoints.map((point, index) => (
                        <li key={index} className="flex items-start">
                          <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs flex-shrink-0 mr-3 mt-0.5">
                            {index + 1}
                          </div>
                          <span className="text-blue-100">{point.point_text}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-blue-200">No hay puntos clave disponibles para esta reunión.</p>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="tasks" className="m-0 p-4 overflow-y-auto h-full">
              {isLoadingDetails ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
                </div>
              ) : (
                <div className="bg-blue-800/20 p-4 rounded-lg">
                  <h3 className="text-xl font-medium text-white mb-4">Tareas asignadas</h3>
                  {meetingDetails?.tasks && meetingDetails.tasks.length > 0 ? (
                    <ul className="space-y-4">
                      {meetingDetails.tasks.map((task) => (
                        <li key={task.id} className="flex items-start">
                          <div
                            className={`h-6 w-6 rounded border flex-shrink-0 mr-3 mt-0.5 flex items-center justify-center ${
                              task.completed ? "bg-green-500 border-green-600" : "border-blue-500"
                            }`}
                          >
                            {task.completed && (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3 w-3 text-white"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-medium">{task.text}</p>
                            {task.description && (
                              <p className="text-blue-200/70 text-sm mt-1">{task.description}</p>
                            )}
                            <div className="flex flex-col sm:flex-row sm:items-center text-sm text-blue-200/70 mt-1">
                              <span className="mr-3">Asignado a: {task.assignee || "No asignado"}</span>
                              <span>
                                Fecha límite:{" "}
                                {task.due_date ? format(new Date(task.due_date), "dd/MM/yyyy") : "Sin fecha"}
                              </span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-blue-200">No hay tareas asignadas para esta reunión.</p>
                  )}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </motion.div>
    </motion.div>
  )
}
