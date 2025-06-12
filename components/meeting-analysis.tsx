"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface MeetingAnalysisProps {
  transcription: Array<{ time?: string; speaker?: string; text: string }>
  summary: string
  keyPoints: string[]
  audioBlob?: Blob
  duration?: string
}

export function MeetingAnalysis({ transcription, summary, keyPoints, audioBlob, duration }: MeetingAnalysisProps) {
  const [title, setTitle] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const audioRef = useRef<HTMLAudioElement>(null)

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Por favor, ingresa un título para la reunión")
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      console.log("Guardando datos de la reunión en la base de datos")

      // Crear un objeto FormData para enviar los datos
      const formData = new FormData()

      // Añadir datos básicos
      formData.append("title", title)
      formData.append("summary", summary)
      if (duration) formData.append("duration", duration)

      // Añadir transcripción, puntos clave y palabras clave como JSON
      if (transcription && transcription.length > 0) {
        formData.append("transcription", JSON.stringify(transcription))
      }

      if (keyPoints && keyPoints.length > 0) {
        formData.append("keyPoints", JSON.stringify(keyPoints))
      }

      // Calcular número de participantes únicos
      const uniqueSpeakers = new Set()
      transcription.forEach((item) => {
        if (item.speaker) uniqueSpeakers.add(item.speaker)
      })

      if (uniqueSpeakers.size > 0) {
        formData.append("participants", uniqueSpeakers.size.toString())
      }

      // Añadir el archivo de audio si existe
      if (audioBlob) {
        // Convertir el Blob a File para mantener el tipo MIME
        const audioFile = new File([audioBlob], "recording.aac", { type: "audio/aac" })
        formData.append("audioFile", audioFile)
      }

      // Enviar los datos al servidor
      const response = await fetch("/api/meetings", {
        method: "POST",
        headers: {
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.details || "Error al guardar la reunión")
      }

      const data = await response.json()
      console.log("Reunión guardada correctamente:", data)

      // Redirigir al dashboard
      router.push("/dashboard")
    } catch (err) {
      console.error("Error al guardar la reunión:", err)
      setError(`Error al guardar la reunión: ${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Análisis de la reunión</h2>

      <div className="bg-blue-950 p-4 rounded-lg">
        <details>
          <summary className="cursor-pointer text-white font-medium flex items-center">
            <span className="mr-2">▶</span> Reproducir grabación
          </summary>
          <div className="mt-4">
            {audioBlob ? (
              <audio
                ref={audioRef}
                controls
                className="w-full"
                src={audioBlob ? URL.createObjectURL(audioBlob) : undefined}
              />
            ) : (
              <p className="text-gray-400">No hay grabación disponible</p>
            )}
          </div>
        </details>
      </div>

      <Tabs defaultValue="resumen">
        <TabsList className="bg-blue-900">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="puntos-clave">Puntos Clave</TabsTrigger>
          <TabsTrigger value="tareas">Tareas</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="bg-blue-950 p-4 rounded-lg text-white">
          <p>{summary}</p>
        </TabsContent>

        <TabsContent value="puntos-clave" className="bg-blue-950 p-4 rounded-lg text-white">
          {keyPoints && keyPoints.length > 0 ? (
            <ul className="list-disc pl-5 space-y-2">
              {keyPoints.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          ) : (
            <p>No se encontraron puntos clave.</p>
          )}
        </TabsContent>

        <TabsContent value="tareas" className="bg-blue-950 p-4 rounded-lg text-white">
          <p>No se encontraron tareas.</p>
        </TabsContent>
      </Tabs>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="meeting-title" className="block text-sm font-medium text-white mb-1">
            Título de la reunión
          </label>
          <Input
            id="meeting-title"
            placeholder="Ingresa un título para esta reunión"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-blue-900 border-blue-800 text-white"
          />
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/dashboard")} disabled={isSaving}>
            Cancelar
          </Button>

          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
