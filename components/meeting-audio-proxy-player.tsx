"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, RefreshCw } from "lucide-react"

interface MeetingAudioProxyPlayerProps {
  meetingId: number
  username: string
}

export default function MeetingAudioProxyPlayer({ meetingId, username }: MeetingAudioProxyPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Crear el elemento de audio con la URL del proxy
    const audio = new Audio(`/api/meetings/${meetingId}/audio-proxy`)

    // Configurar eventos
    audio.addEventListener("play", () => setIsPlaying(true))
    audio.addEventListener("pause", () => setIsPlaying(false))
    audio.addEventListener("ended", () => setIsPlaying(false))

    audio.addEventListener("error", (e) => {
      console.error("Error de audio:", e)
      setError(`Error al reproducir audio: ${audio.error?.message || "Error desconocido"}`)
      setLoading(false)
    })

    audio.addEventListener("loadstart", () => setLoading(true))
    audio.addEventListener("canplay", () => setLoading(false))

    setAudioElement(audio)

    // Limpiar al desmontar
    return () => {
      audio.pause()
      audio.src = ""
      setAudioElement(null)
    }
  }, [meetingId])

  const togglePlay = () => {
    if (!audioElement) return

    if (isPlaying) {
      audioElement.pause()
    } else {
      audioElement.play().catch((err) => {
        console.error("Error al reproducir:", err)
        setError(`Error al reproducir: ${err.message}`)
      })
    }
  }

  const retry = () => {
    if (!audioElement) return

    setError(null)
    setLoading(true)
    audioElement.load()
    audioElement.play().catch((err) => {
      console.error("Error al reintentar:", err)
      setError(`Error al reintentar: ${err.message}`)
      setLoading(false)
    })
  }

  return (
    <div className="p-4 bg-gray-800 rounded-lg text-white">
      <h3 className="text-lg font-medium mb-4">Audio de la Reunión #{meetingId}</h3>

      {loading && (
        <div className="flex items-center justify-center mb-4">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
          <span className="ml-2">Cargando audio...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-900/50 p-3 rounded-md mb-4">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      <div className="flex justify-center space-x-4">
        <Button onClick={togglePlay} className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
          {isPlaying ? <Pause className="mr-2" size={16} /> : <Play className="mr-2" size={16} />}
          {isPlaying ? "Pausar" : "Reproducir"}
        </Button>

        {error && (
          <Button onClick={retry} variant="outline">
            <RefreshCw className="mr-2" size={16} />
            Reintentar
          </Button>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-400">
        <p>ID de la reunión: {meetingId}</p>
        <p>Usuario: {username}</p>
        <p>URL del proxy: /api/meetings/{meetingId}/audio-proxy</p>
      </div>
    </div>
  )
}
