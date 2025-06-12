"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, ExternalLink, RefreshCw } from "lucide-react"

interface AudioFileLinkProps {
  meetingId: string
  username: string
}

export default function AudioFileLink({ meetingId, username }: AudioFileLinkProps) {
  const [audioData, setAudioData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAudioData = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/meetings/${meetingId}/audio-file`, {
          headers: {
          },
        })

        const data = await response.json()
        console.log("Respuesta del servidor:", data)

        if (response.ok && data.fileId) {
          setAudioData(data)
        } else {
          setError(data.error || "No se pudo obtener la información del audio")
        }
      } catch (err) {
        console.error("Error al obtener datos del audio:", err)
        setError("Error al obtener datos del audio")
      } finally {
        setIsLoading(false)
      }
    }

    fetchAudioData()
  }, [meetingId, username])

  const handleRetry = () => {
    setIsLoading(true)
    setError(null)
    // Re-fetch the data
    fetch(`/api/meetings/${meetingId}/audio-file`, {
      headers: {
      },
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Respuesta del servidor (retry):", data)
        if (data.fileId) {
          setAudioData(data)
          setError(null)
        } else {
          setError(data.error || "No se pudo obtener la información del audio")
        }
      })
      .catch((err) => {
        console.error("Error al obtener datos del audio (retry):", err)
        setError("Error al obtener datos del audio")
      })
      .finally(() => {
        setIsLoading(false)
      })
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
        <Button onClick={handleRetry} className="flex items-center gap-2">
          <RefreshCw size={16} />
          Reintentar
        </Button>
      </div>
    )
  }

  if (!audioData) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-gray-800 rounded-lg text-white">
        <p>No se encontró archivo de audio para esta reunión.</p>
      </div>
    )
  }

  // Mostrar el nombre del archivo sin el ID al principio
  const displayFileName = audioData.fileName.includes("_")
    ? audioData.fileName.substring(audioData.fileName.indexOf("_") + 1)
    : audioData.fileName

  return (
    <div className="flex flex-col p-6 bg-gray-800 rounded-lg text-white">
      <div className="mb-4 text-center">
        <h3 className="text-lg font-medium">Audio encontrado</h3>
        <p className="text-sm text-gray-300 mt-1">{displayFileName}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 mt-2">
        <Button
          onClick={() => window.open(`https://drive.google.com/file/d/${audioData.fileId}/view`, "_blank")}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <ExternalLink size={16} />
          Abrir en Google Drive
        </Button>

        <Button
          onClick={() => window.open(`https://drive.google.com/uc?export=download&id=${audioData.fileId}`, "_blank")}
          className="flex items-center justify-center gap-2"
        >
          <Download size={16} />
          Descargar audio
        </Button>
      </div>
    </div>
  )
}
