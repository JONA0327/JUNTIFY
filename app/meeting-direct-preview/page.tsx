"use client"

import type React from "react"

import { useState } from "react"
import MeetingDirectPreview from "@/components/meeting-direct-preview"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function MeetingDirectPreviewPage() {
  const [meetingId, setMeetingId] = useState<number | null>(null)
  const [inputValue, setInputValue] = useState<string>("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const id = Number.parseInt(inputValue)
    if (!isNaN(id)) {
      setMeetingId(id)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Vista Previa Directa de Audio de Reunión</h1>

      <form onSubmit={handleSubmit} className="mb-8 flex gap-2 items-end">
        <div className="flex-1">
          <label htmlFor="meetingId" className="block text-sm font-medium text-gray-700 mb-1">
            ID de la reunión
          </label>
          <Input
            id="meetingId"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ingresa el ID de la reunión"
            className="w-full"
            type="number"
          />
        </div>
        <Button type="submit">Cargar</Button>
      </form>

      {meetingId ? (
        <MeetingDirectPreview meetingId={meetingId} />
      ) : (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700">
            Ingresa un ID de reunión y haz clic en "Cargar" para ver la vista previa del audio.
          </p>
        </div>
      )}
    </div>
  )
}
