"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, Volume2, VolumeX, RefreshCw, Download, ExternalLink } from "lucide-react"

interface AudioPlayerProps {
  meetingId: number
  username: string
}

export default function AudioPlayer({ meetingId, username }: AudioPlayerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [audioInfo, setAudioInfo] = useState<any>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)

  // Función para obtener la información del archivo de audio
  const fetchAudioInfo = async () => {
    try {
      setIsLoading(true)
      setError(null)

      console.log(`Buscando audio para la reunión ${meetingId} del usuario ${username}`)

      const response = await fetch(`/api/meetings/${meetingId}/audio-file`, {
        headers: {
          "X-Username": username,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al buscar archivo de audio")
      }

      const data = await response.json()
      console.log("Respuesta del servidor:", data)

      if (!data.success || !data.fileId) {
        throw new Error("No se encontró el archivo de audio")
      }

      setAudioInfo(data)

      // Usar el nuevo endpoint de streaming
      const audioUrl = `/api/audio-stream/${data.fileId}`
      setAudioUrl(audioUrl)

      // Crear elemento de audio
      const audio = new Audio(audioUrl)
      audio.addEventListener("loadedmetadata", () => {
        setDuration(audio.duration)
      })
      audio.addEventListener("timeupdate", () => {
        setCurrentTime(audio.currentTime)
      })
      audio.addEventListener("ended", () => {
        setIsPlaying(false)
      })

      setAudioElement(audio)
      setIsLoading(false)
    } catch (err) {
      console.error("Error fetching audio:", err)
      setError(`Error al buscar archivo de audio: ${err instanceof Error ? err.message : String(err)}`)
      setIsLoading(false)
    }
  }

  // Cargar la información del audio al montar el componente
  useEffect(() => {
    fetchAudioInfo()

    // Limpiar recursos al desmontar
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
      if (audioElement) {
        audioElement.pause()
        audioElement.src = ""
      }
    }
  }, [meetingId, username])

  // Función para reproducir/pausar el audio
  const togglePlay = () => {
    if (!audioElement) return

    if (isPlaying) {
      audioElement.pause()
    } else {
      audioElement.play()
    }

    setIsPlaying(!isPlaying)
  }

  // Función para silenciar/activar el audio
  const toggleMute = () => {
    if (!audioElement) return

    audioElement.muted = !isMuted
    setIsMuted(!isMuted)
  }

  // Función para cambiar la posición de reproducción
  const handleSliderChange = (value: number[]) => {
    if (!audioElement) return

    const newTime = value[0]
    audioElement.currentTime = newTime
    setCurrentTime(newTime)
  }

  // Función para formatear el tiempo
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
  }

  // Función para reintentar la carga
  const handleRetry = () => {
    fetchAudioInfo()
  }

  // Función para descargar el archivo
  const handleDownload = () => {
    if (!audioBlob || !audioInfo) return

    const a = document.createElement("a")
    a.href = audioUrl!
    a.download = audioInfo.fileName || `audio_${meetingId}.aac`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  // Función para abrir en Google Drive
  const openInGoogleDrive = () => {
    if (!audioInfo || !audioInfo.fileId) return

    window.open(`https://drive.google.com/file/d/${audioInfo.fileId}/view`, "_blank")
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-gray-800 rounded-lg text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mb-4"></div>
        <p>Cargando audio...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-gray-800 rounded-lg text-white">
        <p className="text-red-400 mb-4">{error}</p>
        <div className="flex gap-2">
          <Button onClick={handleRetry} className="flex items-center gap-2">
            <RefreshCw size={16} />
            Reintentar
          </Button>
          {audioInfo && audioInfo.fileId && (
            <Button onClick={openInGoogleDrive} className="flex items-center gap-2">
              <ExternalLink size={16} />
              Abrir en Drive
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (!audioUrl || !audioElement) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-gray-800 rounded-lg text-white">
        <p>No se pudo cargar el reproductor de audio.</p>
        <Button onClick={handleRetry} className="mt-4 flex items-center gap-2">
          <RefreshCw size={16} />
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col p-6 bg-gray-800 rounded-lg text-white">
      {audioInfo && audioInfo.fileName && (
        <div className="mb-4 text-center">
          <p className="text-sm text-gray-300">
            {audioInfo.fileName.includes("_")
              ? audioInfo.fileName.substring(audioInfo.fileName.indexOf("_") + 1)
              : audioInfo.fileName}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <span className="text-sm">{formatTime(currentTime)}</span>
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.1}
          onValueChange={handleSliderChange}
          className="mx-4 flex-1"
        />
        <span className="text-sm">{formatTime(duration)}</span>
      </div>

      <div className="flex justify-center space-x-4 mt-2">
        <Button
          onClick={toggleMute}
          variant="outline"
          size="icon"
          className="rounded-full w-10 h-10 flex items-center justify-center"
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </Button>

        <Button
          onClick={togglePlay}
          variant="default"
          size="icon"
          className="rounded-full w-12 h-12 flex items-center justify-center bg-blue-600 hover:bg-blue-700"
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </Button>

        <Button
          onClick={handleDownload}
          variant="outline"
          size="icon"
          className="rounded-full w-10 h-10 flex items-center justify-center"
        >
          <Download size={18} />
        </Button>
      </div>
    </div>
  )
}
