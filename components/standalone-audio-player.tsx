"use client"

import type React from "react"

import { useState } from "react"

export default function StandaloneAudioPlayer() {
  const [fileId, setFileId] = useState<string>("1edp0MI5lDrXWogFFO10SGTkBJp1glRa-")
  const [customFileId, setCustomFileId] = useState<string>("")
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Crear una URL de objeto para el audio
  const directDownloadUrl = `https://docs.google.com/uc?export=download&id=${fileId}`
  const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`
  const viewUrl = `https://drive.google.com/file/d/${fileId}/view`

  const handleCustomIdSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (customFileId.trim()) {
      setFileId(customFileId.trim())
    }
  }

  return (
    <div className="p-6 bg-gray-800 rounded-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">Reproductor de Audio Independiente</h2>

      <div className="mb-6">
        <h3 className="text-lg font-medium text-white mb-3">Reproductor de Audio Nativo</h3>
        <audio controls className="w-full mb-2" src={directDownloadUrl} controlsList="nodownload">
          Tu navegador no soporta el elemento de audio.
        </audio>
        <div className="flex space-x-2 mt-2">
          <a
            href={directDownloadUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Descargar Audio
          </a>
          <a
            href={viewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
          >
            Abrir en Google Drive
          </a>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-medium text-white mb-3">Reproductor de Google Drive</h3>
        <iframe src={previewUrl} width="100%" height="80" allow="autoplay" className="border-0 mb-2"></iframe>
      </div>

      <button onClick={() => setShowAdvanced(!showAdvanced)} className="text-blue-400 hover:underline mb-4">
        {showAdvanced ? "Ocultar opciones avanzadas" : "Mostrar opciones avanzadas"}
      </button>

      {showAdvanced && (
        <div className="mt-4 p-4 bg-gray-700 rounded-lg">
          <h3 className="text-lg font-medium text-white mb-3">Opciones Avanzadas</h3>

          <form onSubmit={handleCustomIdSubmit} className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">ID personalizado de Google Drive:</label>
            <div className="flex">
              <input
                type="text"
                value={customFileId}
                onChange={(e) => setCustomFileId(e.target.value)}
                placeholder="Introduce el ID del archivo"
                className="flex-1 px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-r hover:bg-blue-700">
                Aplicar
              </button>
            </div>
          </form>

          <div className="space-y-2">
            <p className="text-sm text-gray-300">
              <span className="font-medium">ID actual:</span> {fileId}
            </p>
            <p className="text-sm text-gray-300">
              <span className="font-medium">URL de descarga:</span>{" "}
              <a
                href={directDownloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline break-all"
              >
                {directDownloadUrl}
              </a>
            </p>
            <p className="text-sm text-gray-300">
              <span className="font-medium">URL de vista previa:</span>{" "}
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline break-all"
              >
                {previewUrl}
              </a>
            </p>
            <p className="text-sm text-gray-300">
              <span className="font-medium">URL de visualización:</span>{" "}
              <a
                href={viewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline break-all"
              >
                {viewUrl}
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
