"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Play, Pause, Volume2, VolumeX } from "lucide-react"

interface AudioPlayerDriveProps {
  audioUrl: string
  className?: string
}

export default function AudioPlayerDrive({ audioUrl, className = "" }: AudioPlayerDriveProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Formatear la URL si es un ID de Google Drive
  const formattedUrl = audioUrl.startsWith("http")
    ? audioUrl
    : `https://drive.google.com/uc?id=${audioUrl}&export=download`

  useEffect(() => {
    // Crear un nuevo elemento de audio
    const audio = new Audio(formattedUrl)
    audioRef.current = audio

    // Configurar eventos
    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration)
      setIsLoading(false)
    })

    audio.addEventListener("timeupdate", () => {
      setCurrentTime(audio.currentTime)
    })

    audio.addEventListener("ended", () => {
      setIsPlaying(false)
      setCurrentTime(0)
    })

    audio.addEventListener("error", (e) => {
      console.error("Error al cargar el audio:", e)
      setError("No se pudo cargar el audio. Verifica la URL o tu conexión.")
      setIsLoading(false)
    })

    // Limpiar eventos al desmontar
    return () => {
      audio.pause()
      audio.src = ""
      audio.removeEventListener("loadedmetadata", () => {})
      audio.removeEventListener("timeupdate", () => {})
      audio.removeEventListener("ended", () => {})
      audio.removeEventListener("error", () => {})
    }
  }, [formattedUrl])

  // Formatear tiempo (segundos -> mm:ss)
  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00"
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  // Controlar reproducción
  const togglePlay = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch((error) => {
        console.error("Error al reproducir:", error)
        setError("No se pudo reproducir el audio. Intenta de nuevo.")
      })
    }
    setIsPlaying(!isPlaying)
  }

  // Controlar volumen
  const toggleMute = () => {
    if (!audioRef.current) return

    if (isMuted) {
      audioRef.current.volume = volume
    } else {
      audioRef.current.volume = 0
    }
    setIsMuted(!isMuted)
  }

  // Cambiar posición de reproducción
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return

    const newTime = Number.parseFloat(e.target.value)
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  // Cambiar volumen
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return

    const newVolume = Number.parseFloat(e.target.value)
    audioRef.current.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="animate-pulse text-blue-500">Cargando audio...</div>
      </div>
    )
  }

  if (error) {
    return <div className={`flex items-center justify-center p-4 text-red-500 ${className}`}>{error}</div>
  }

  return (
    <div className={`flex flex-col space-y-2 p-4 bg-gray-800 rounded-lg ${className}`}>
      <div className="flex items-center space-x-4">
        <button
          onClick={togglePlay}
          className="w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-700 rounded-full text-white"
          aria-label={isPlaying ? "Pausar" : "Reproducir"}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
        </button>

        <div className="flex-1 flex flex-col space-y-1">
          <div className="flex justify-between text-xs text-gray-300">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            aria-label="Posición de reproducción"
          />
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={toggleMute}
            className="text-gray-300 hover:text-white"
            aria-label={isMuted ? "Activar sonido" : "Silenciar"}
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-16 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            aria-label="Volumen"
          />
        </div>
      </div>

      <div className="text-xs text-gray-400 text-center">
        <a href={formattedUrl} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 underline">
          Descargar audio
        </a>
      </div>
    </div>
  )
}
