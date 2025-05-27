"use client"

import type React from "react"

import { useState } from "react"
import ProxyAudioPlayer from "@/components/proxy-audio-player"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function ProxyPlayerPage() {
  const [fileId, setFileId] = useState("")
  const [currentFileId, setCurrentFileId] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentFileId(fileId)
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Reproductor de Audio con Proxy</h1>

      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-medium mb-2">Instrucciones</h2>
        <p className="mb-2">
          Este reproductor utiliza un proxy del servidor para transmitir el audio directamente desde Google Drive,
          evitando problemas de CORS y permisos.
        </p>
        <p>Ingresa el ID del archivo de Google Drive y haz clic en "Cargar" para reproducirlo.</p>
      </div>

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-2">
          <Input
            type="text"
            value={fileId}
            onChange={(e) => setFileId(e.target.value)}
            placeholder="ID del archivo de Google Drive"
            className="flex-1"
          />
          <Button type="submit">Cargar</Button>
        </div>
      </form>

      {currentFileId ? (
        <ProxyAudioPlayer fileId={currentFileId} />
      ) : (
        <div className="bg-gray-800 p-6 rounded-lg text-white text-center">Ingresa un ID de archivo para comenzar</div>
      )}

      <div className="mt-6 bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
        <h3 className="font-medium text-yellow-800 mb-2">¿Cómo obtener el ID del archivo?</h3>
        <p className="text-yellow-700 text-sm">
          El ID del archivo es la parte de la URL de Google Drive después de "https://drive.google.com/file/d/" y antes
          de "/view".
          <br />
          Ejemplo: En "https://drive.google.com/file/d/<strong>1a2b3c4d5e6f7g8h9i0j</strong>/view", el ID es
          "1a2b3c4d5e6f7g8h9i0j".
        </p>
      </div>
    </div>
  )
}
