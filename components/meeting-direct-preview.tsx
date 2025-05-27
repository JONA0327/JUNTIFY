"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"

interface MeetingDirectPreviewProps {
  meetingId: number
}

interface AudioFileInfo {
  fileId: string
  fileName: string
  mimeType: string
  directUrl: string
}

export default function MeetingDirectPreview({ meetingId }: MeetingDirectPreviewProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [audioInfo, setAudioInfo] = useState<AudioFileInfo | null>(null)

  useEffect(() => {
    const fetchAudioInfo = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/meetings/${meetingId}/audio-direct-url`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        setAudioInfo(data)
      } catch (err) {
        console.error("Error al obtener información del audio:", err)
        setError(err.message || "Error al obtener información del audio")
      } finally {
        setLoading(false)
      }
    }

    fetchAudioInfo()
  }, [meetingId])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
        <p>Cargando información del audio...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <h3 className="text-lg font-medium mb-2">Error</h3>
        <p>{error}</p>
      </div>
    )
  }

  if (!audioInfo) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-medium mb-2">No se encontró información del audio</h3>
        <p>No se pudo obtener la información del archivo de audio para esta reunión.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="p-4 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-medium mb-2">Información del archivo</h3>
        <ul className="text-sm space-y-1">
          <li>
            <strong>ID del archivo:</strong> {audioInfo.fileId}
          </li>
          <li>
            <strong>Nombre:</strong> {audioInfo.fileName}
          </li>
          <li>
            <strong>Tipo MIME:</strong> {audioInfo.mimeType}
          </li>
          <li>
            <strong>URL directa:</strong> <code className="bg-gray-200 px-1 py-0.5 rounded">{audioInfo.directUrl}</code>
          </li>
        </ul>
      </div>

      <div className="p-4 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-medium mb-2">Vista previa de Google Drive</h3>
        <div className="aspect-video w-full border border-gray-300 rounded-lg overflow-hidden">
          <iframe src={audioInfo.directUrl} className="w-full h-full" allow="autoplay" allowFullScreen></iframe>
        </div>
      </div>

      <div className="p-4 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-medium mb-2">Enlaces directos</h3>
        <div className="flex flex-col gap-2">
          <a
            href={audioInfo.directUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Abrir vista previa en Google Drive
          </a>
          <a
            href={`https://drive.google.com/file/d/${audioInfo.fileId}/view`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Ver en Google Drive
          </a>
          <a
            href={`https://drive.google.com/uc?export=download&id=${audioInfo.fileId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Descargar archivo
          </a>
        </div>
      </div>
    </div>
  )
}
