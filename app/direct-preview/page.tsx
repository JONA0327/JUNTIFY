"use client"

import type React from "react"

import { useState } from "react"
import DirectDrivePreview from "@/components/direct-drive-preview"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function DirectPreviewPage() {
  const [fileId, setFileId] = useState<string>("1edp0MI5lDrXWogFFO10SGTkBJp1glRa-")
  const [inputValue, setInputValue] = useState<string>("1edp0MI5lDrXWogFFO10SGTkBJp1glRa-")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFileId(inputValue)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Vista Previa Directa de Google Drive</h1>

      <form onSubmit={handleSubmit} className="mb-8 flex gap-2 items-end">
        <div className="flex-1">
          <label htmlFor="fileId" className="block text-sm font-medium text-gray-700 mb-1">
            ID del archivo de Google Drive
          </label>
          <Input
            id="fileId"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ingresa el ID del archivo"
            className="w-full"
          />
        </div>
        <Button type="submit">Cargar</Button>
      </form>

      <DirectDrivePreview fileId={fileId} />

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-medium text-yellow-800 mb-2">Información importante</h3>
        <ul className="list-disc pl-5 text-yellow-700 space-y-1">
          <li>
            La URL que funciona en Postman es:{" "}
            <code className="bg-yellow-100 px-1 py-0.5 rounded">
              https://drive.google.com/file/d/1edp0MI5lDrXWogFFO10SGTkBJp1glRa-/preview
            </code>
          </li>
          <li>Esta página usa exactamente la misma estructura de URL</li>
          <li>
            Si funciona aquí pero no en otras partes de la aplicación, puede haber un problema con cómo se construye la
            URL en esos lugares
          </li>
          <li>Asegúrate de que el archivo tenga permisos para "cualquiera con el enlace"</li>
        </ul>
      </div>
    </div>
  )
}
