"use client"

import { useState, useEffect } from "react"
import { NewNavbar } from "@/components/new-navbar"
import { Search, Plus, Loader2, MessageSquare } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"


import { addUsernameToHeaders } from "@/utils/user-helpers"
import { AIChatModal } from "@/components/ai-chat-modal"


// Tarjeta para un contenedor de reuniones
const ContainerCard = ({ container, onClick, isSelected }) => {
  return (
    <motion.div
      className={`border ${isSelected ? "border-blue-500" : "border-blue-700/30"} rounded-lg p-3 sm:p-4 cursor-pointer transition-all ${
        isSelected ? "bg-blue-700/40" : "bg-blue-800/30 hover:bg-blue-700/30"
      }`}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onClick(container)}
    >
      <h3 className="text-base sm:text-lg font-medium text-white mb-1 sm:mb-2 line-clamp-2">
        {container.name}
      </h3>
    </motion.div>
  )
}

export default function AIAssistantPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedContainer, setSelectedContainer] = useState(null)
  const [showChatModal, setShowChatModal] = useState(false)
  const [containers, setContainers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Cargar los contenedores del usuario
  useEffect(() => {
    const fetchContainers = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/containers", {
          headers: addUsernameToHeaders(),
        })

        if (!response.ok) {
          throw new Error("Error al cargar los contenedores")
        }

        const data = await response.json()
        setContainers(data)
      } catch (error) {
        console.error("Error al cargar los contenedores:", error)
        setError("No se pudieron cargar los contenedores. Por favor, inténtalo de nuevo más tarde.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchContainers()
  }, [])

  // Función para seleccionar un contenedor y mostrar el modal
  const handleSelectContainer = (container) => {
    setSelectedContainer(container)
    setShowChatModal(true)
  }

  const handleCreateContainer = async () => {
    const name = prompt("Nombre del nuevo contenedor")
    if (!name) return
    try {
      const response = await fetch("/api/containers", {
        method: "POST",
        headers: addUsernameToHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ name }),
      })
      if (response.ok) {
        const created = await response.json()
        setContainers((prev) => [...prev, created])
      }
    } catch (err) {
      console.error("Error creando contenedor", err)
    }
  }

  // Filtrar contenedores según el término de búsqueda
  const filteredContainers = containers.filter((c) =>
    searchTerm === "" || c.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Ordenar contenedores alfabéticamente
  const sortedContainers = [...filteredContainers].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="min-h-screen bg-blue-900">
      <main className="container mx-auto px-3 sm:px-4 pb-24 pt-6 sm:pt-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-8 glow-text">Asistente IA</h1>

          {/* Barra de búsqueda y filtros */}
          <div className="mb-4 sm:mb-8 bg-blue-800/30 border border-blue-700/30 rounded-lg p-3 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              {/* Búsqueda por término */}
              <div className="col-span-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-300" />
                  <input
                    type="text"
                    placeholder="Buscar por título o contenido..."
                    className="pl-10 w-full bg-blue-700/40 border border-blue-600/50 text-white rounded-lg p-2 sm:p-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Sección para futuros filtros */}
            </div>
          </div>

          {/* Estado de carga */}
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-12 w-12 text-blue-400 animate-spin" />
            </div>
          )}

          {/* Mensaje de error */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-8 text-center">
              <p className="text-white">{error}</p>
            </div>
          )}

          {/* Grid de contenedores */}
          {!isLoading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
              {sortedContainers.length > 0 ? (
                sortedContainers.map((container) => (
                  <ContainerCard
                    key={container.id}
                    container={container}
                    onClick={handleSelectContainer}
                    isSelected={selectedContainer?.id === container.id}
                  />
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-8 sm:py-12 text-center">
                  <div className="rounded-full bg-blue-800/40 p-4 mb-4">
                    <MessageSquare className="h-8 w-8 sm:h-10 sm:w-10 text-blue-300" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-medium text-white mb-1 sm:mb-2">
                    No hay contenedores disponibles
                  </h3>
                  <p className="text-blue-300/70 max-w-md text-sm sm:text-base px-4">
                    Crea un contenedor para agrupar varias reuniones y conversar con la IA.
                  </p>
                  <Button className="mt-4 bg-blue-600 hover:bg-blue-700" onClick={handleCreateContainer}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo contenedor
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modal de chat con IA */}
      <AnimatePresence>
        {showChatModal && selectedContainer && (
          <AIChatModal
            meeting={{ id: selectedContainer.id, title: selectedContainer.name }}
            onClose={() => {
              setShowChatModal(false)
            }}
          />
        )}
      </AnimatePresence>

      {/* Navbar */}
      <NewNavbar />
    </div>
  )
}
