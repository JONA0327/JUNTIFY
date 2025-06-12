"use client"

import { useState, useEffect } from "react"
import { RefreshCw } from "lucide-react"

interface DynamicAudioPlayerProps {
  meetingId: number
  username: string
}

export default function DynamicAudioPlayer({ meetingId, username }: DynamicAudioPlayerProps) {
  const [fileId, setFileId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAudioInfo()
  }, [meetingId, username])

  const fetchAudioInfo = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/meetings/${meetingId}/audio-file`, {
        headers: {
        },
      })

      const data = await response.json()

      if (!response.ok || !data.fileId) {
        throw new Error(data.error || "No se encontró el archivo de audio")
      }

      console.log("Audio file info:", data)
      setFileId(data.fileId)
      setIsLoading(false)
    } catch (err) {
      console.error("Error fetching audio info:", err)
      setError(err instanceof Error ? err.message : "Error al buscar archivo de audio")
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <div className="text-center p-4 text-white">Cargando información del audio...</div>
  }

  if (error) {
    return (
      <div className="text-center p-4">
        <p className="text-red-500 mb-2">{error}</p>
        <button
          onClick={fetchAudioInfo}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 mx-auto"
        >
          <RefreshCw size={16} />
          Reintentar
        </button>
      </div>
    )
  }

  if (!fileId) {
    return <div className="text-center p-4 text-white">No se encontró el archivo de audio para esta reunión.</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white mb-2">Reproductor de Google Drive</h3>
        <iframe
          src={`https://drive.google.com/file/d/${fileId}/preview`}
          width="100%"
          height="80"
          allow="autoplay"
          style={{ border: "none" }}
        ></iframe>
        <div className="mt-2 text-sm text-gray-400">
          <a
            href={`https://drive.google.com/file/d/${fileId}/view`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            Abrir en Google Drive
          </a>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-white mb-2">Reproductor de audio nativo</h3>
        <audio controls className="w-full" src={`https://docs.google.com/uc?export=download&id=${fileId}`}>
          Tu navegador no soporta el elemento de audio.
        </audio>
        <div className="mt-2 text-sm text-gray-400">
          <a
            href={`https://docs.google.com/uc?export=download&id=${fileId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            Descargar audio
          </a>
        </div>
      </div>

      <div className="mt-4 p-4 bg-gray-700 rounded-lg">
        <h3 className="text-lg font-medium text-white mb-2">Información técnica</h3>
        <p className="text-sm text-gray-300">ID del archivo: {fileId}</p>
        <p className="text-sm text-gray-300">ID de la reunión: {meetingId}</p>
      </div>
    </div>
  )
}
