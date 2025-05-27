"use client"
import { ExternalLink } from "lucide-react"

interface DirectDrivePlayerProps {
  fileId: string
}

export default function DirectDrivePlayer({ fileId }: DirectDrivePlayerProps) {
  if (!fileId) {
    return <div className="text-center p-4">No se proporcionó un ID de archivo.</div>
  }

  return (
    <div className="flex flex-col items-center">
      {/* Opción 1: iframe de Google Drive */}
      <div className="w-full mb-4">
        <iframe
          src={`https://drive.google.com/file/d/${fileId}/preview`}
          width="100%"
          height="80"
          allow="autoplay"
          className="border-0"
        ></iframe>
      </div>

      {/* Opción 2: Etiqueta audio nativa */}
      <div className="w-full mb-4">
        <audio controls src={`https://docs.google.com/uc?export=download&id=${fileId}`} className="w-full">
          Tu navegador no soporta la reproducción de audio.
        </audio>
      </div>

      {/* Links directos */}
      <div className="flex space-x-4">
        <a
          href={`https://docs.google.com/uc?export=download&id=${fileId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline text-sm flex items-center gap-1"
        >
          Descargar audio
        </a>
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
    </div>
  )
}
