"use client"

import { useState, useEffect } from "react"

interface DirectDrivePreviewProps {
  fileId: string
}

export default function DirectDrivePreview({ fileId }: DirectDrivePreviewProps) {
  const [url, setUrl] = useState<string>("")

  useEffect(() => {
    // Construir la URL exactamente como la que funciona en Postman
    const directUrl = `https://drive.google.com/file/d/${fileId}/preview`
    setUrl(directUrl)

    console.log("URL directa de Google Drive:", directUrl)
  }, [fileId])

  return (
    <div className="flex flex-col gap-4">
      <div className="p-4 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-medium mb-2">Vista previa directa de Google Drive</h3>
        <p className="text-sm text-gray-500 mb-4">
          Usando la URL exacta que funciona en Postman: <code className="bg-gray-200 px-1 py-0.5 rounded">{url}</code>
        </p>

        {url && (
          <div className="aspect-video w-full border border-gray-300 rounded-lg overflow-hidden">
            <iframe src={url} className="w-full h-full" allow="autoplay" allowFullScreen></iframe>
          </div>
        )}
      </div>

      <div className="p-4 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-medium mb-2">Audio directo (etiqueta audio)</h3>
        <p className="text-sm text-gray-500 mb-4">Intentando reproducir directamente con la etiqueta audio:</p>

        {url && (
          <audio controls src={url.replace("/preview", "")} className="w-full">
            Tu navegador no soporta el elemento de audio.
          </audio>
        )}
      </div>

      <div className="p-4 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-medium mb-2">Enlace directo</h3>
        <p className="text-sm text-gray-500 mb-4">Enlace directo para abrir en una nueva pestaña:</p>

        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            Abrir archivo en Google Drive
          </a>
        )}
      </div>
    </div>
  )
}
