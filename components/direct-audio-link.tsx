"use client"

import { useState, useEffect } from "react"
import { Download, ExternalLink, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DirectAudioLinkProps {
  meetingId: string
  username: string
}

export default function DirectAudioLink({ meetingId, username }: DirectAudioLinkProps) {
  const [audioInfo, setAudioInfo] = useState<{
    fileId: string
    fileName: string
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const fetchAudioInfo = async () => {
      try {
        setIsLoading(true)
        setError(null)
        console.log(`Buscando audio para la reunión ${meetingId} del usuario ${username}`)

        const response = await fetch(`/api/meetings/${meetingId}/audio-file`, {
          headers: {
          },
        })

        const data = await response.json()
        console.log("Respuesta completa del servidor:", data)

        if (data.fileId) {
          console.log("ID de archivo encontrado:", data.fileId)
          setAudioInfo({
            fileId: data.fileId,
            fileName: data.fileName || "audio.aac",
          })
          setIsLoading(false)
        } else {
          console.error("No se encontró el ID del archivo en la respuesta:", data)
          setError("No se encontró el ID del archivo en la respuesta")
          setIsLoading(false)
        }
      } catch (err) {
        console.error("Error fetching audio:", err)
        setError(err instanceof Error ? err.message : "Error al buscar archivo de audio")
        setIsLoading(false)
      }
    }

    if (meetingId && username) {
      fetchAudioInfo()
    }
  }, [meetingId, username, retryCount])

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
  }

  const handleDownload = () => {
    if (audioInfo?.fileId) {
      window.open(`https://drive.google.com/uc?export=download&id=${audioInfo.fileId}`, "_blank")
    }
  }

  const openInNewTab = () => {
    if (audioInfo?.fileId) {
      window.open(`https://drive.google.com/file/d/${audioInfo.fileId}/view`, "_blank")
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-gray-800 rounded-lg text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mb-4"></div>
        <p>Buscando archivo de audio...</p>
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
        </div>
      </div>
    )
  }

  if (!audioInfo) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-gray-800 rounded-lg text-white">
        <p>No se encontró archivo de audio para esta reunión.</p>
      </div>
    )
  }

  // Mostrar el nombre del archivo sin el ID al principio
  const displayFileName = audioInfo.fileName.includes("_")
    ? audioInfo.fileName.substring(audioInfo.fileName.indexOf("_") + 1)
    : audioInfo.fileName

  return (
    <div className="flex flex-col p-6 bg-gray-800 rounded-lg text-white">
      <div className="mb-4 text-center">
        <h3 className="text-lg font-medium">Audio encontrado</h3>
        <p className="text-sm text-gray-300 mt-1">{displayFileName}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 mt-2">
        <Button onClick={openInNewTab} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700">
          <ExternalLink size={16} />
          Abrir en Google Drive
        </Button>

        <Button onClick={handleDownload} className="flex items-center justify-center gap-2">
          <Download size={16} />
          Descargar audio
        </Button>
      </div>

      <div className="mt-4 text-xs text-gray-400 text-center">
        <p>El reproductor de audio no está disponible en esta vista.</p>
        <p>Por favor, utiliza los botones para abrir o descargar el archivo.</p>
      </div>
    </div>
  )
}
