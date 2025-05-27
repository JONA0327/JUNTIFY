"use client"

import type React from "react"

import { useState, useEffect } from "react"
import MeetingAudioProxyPlayer from "@/components/meeting-audio-proxy-player"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function MeetingProxyPlayerPage() {
  const [meetingId, setMeetingId] = useState("")
  const [currentMeetingId, setCurrentMeetingId] = useState<number | null>(null)
  const [username, setUsername] = useState("")

  useEffect(() => {
    // Intentar obtener el nombre de usuario del localStorage
    const storedUsername = localStorage.getItem("username")
    if (storedUsername) {
      setUsername(storedUsername)
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Guardar el nombre de usuario en localStorage
    if (username) {
      localStorage.setItem("username", username)
    }

    // Convertir el ID de la reunión a número
    const id = Number.parseInt(meetingId)
    if (!isNaN(id)) {
      setCurrentMeetingId(id)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Reproductor de Audio de Reunión con Proxy</h1>

      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-medium mb-2">Instrucciones</h2>
        <p className="mb-2">
          Este reproductor busca el audio de una reunión específica y lo transmite a través de un proxy del servidor,
          evitando problemas de CORS y permisos.
        </p>
        <p>Ingresa el ID de la reunión y tu nombre de usuario, luego haz clic en "Cargar" para reproducir el audio.</p>
      </div>

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="grid gap-4">
          <div>
            <label htmlFor="meetingId" className="block text-sm font-medium mb-1">
              ID de la Reunión
            </label>
            <Input
              id="meetingId"
              type="number"
              value={meetingId}
              onChange={(e) => setMeetingId(e.target.value)}
              placeholder="Ej: 98"
            />
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-1">
              Nombre de Usuario
            </label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ej: Jona0327"
            />
          </div>

          <Button type="submit">Cargar Audio</Button>
        </div>
      </form>

      {currentMeetingId && username ? (
        <MeetingAudioProxyPlayer meetingId={currentMeetingId} username={username} />
      ) : (
        <div className="bg-gray-800 p-6 rounded-lg text-white text-center">
          Ingresa el ID de la reunión y tu nombre de usuario para comenzar
        </div>
      )}
    </div>
  )
}
