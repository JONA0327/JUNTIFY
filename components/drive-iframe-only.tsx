"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, ExternalLink } from "lucide-react"

interface DriveIframeOnlyProps {
  meetingId: number
  username: string
}

export default function DriveIframeOnly({ meetingId, username }: DriveIframeOnlyProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fileId, setFileId] = useState<string | null>(null)

  useEffect(() => {
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

        setFileId(data.fileId)
        setIsLoading(false)
      } catch (err) {
        console.error("Error fetching audio info:", err)
        setError(err instanceof Error ? err.message : "Error al buscar archivo de audio")
        setIsLoading(false)
      }
    }

    fetchAudioInfo()
  }, [meetingId, username])

  if (isLoading) {
    return <div className="text-center p-4">Cargando reproductor de audio...</div>
  }

  if (error) {
    return (
      <div className="text-center p-4">
        <p className="text-red-500 mb-2">{error}</p>
        <Button onClick={() => window.location.reload()} size="sm" className="flex items-center gap-2">
          <RefreshCw size={16} />
          Reintentar
        </Button>
      </div>
    )
  }

  if (!fileId) {
    return <div className="text-center p-4">No se encontró el archivo de audio.</div>
  }

  return (
    <div className="flex flex-col items-center">
      {/* Solo iframe de Google Drive */}
      <iframe
        src={`https://drive.google.com/file/d/${fileId}/preview`}
        width="100%"
        height="80"
        allow="autoplay"
        className="border-0 mb-4"
      ></iframe>

      {/* Link para abrir en Google Drive */}
      <a
        href={`https://drive.google.com/file/d/${fileId}/view`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 hover:underline text-sm flex items-center gap-1"
      >
        <ExternalLink size={14} />
        Abrir en Google Drive
      </a>
    </div>
  )
}
