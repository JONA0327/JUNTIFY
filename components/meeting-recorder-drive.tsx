"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { formatTime } from "@/utils/format-time"

interface MeetingRecorderDriveProps {
  onMeetingCreated?: (meetingId: string) => void
  onRecordingComplete?: (audioUrl: string, meetingId: string) => void
}

export default function MeetingRecorderDrive({ onMeetingCreated, onRecordingComplete }: MeetingRecorderDriveProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [meetingId, setMeetingId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isGoogleDriveConfigured, setIsGoogleDriveConfigured] = useState(true)
  const [isCheckingGoogleDrive, setIsCheckingGoogleDrive] = useState(true)

  const { toast } = useToast()
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Verificar si Google Drive está configurado
  useEffect(() => {
    const checkGoogleDriveStatus = async () => {
      try {
        setIsCheckingGoogleDrive(true)
        const response = await fetch("/api/auth/google/status")
        const data = await response.json()

        setIsGoogleDriveConfigured(data.isConfigured && data.hasFolders)

        if (!data.isConfigured) {
          setErrorMessage("Google Drive no está configurado. Por favor, configura tu cuenta de Google Drive.")
        } else if (!data.hasFolders) {
          setErrorMessage(
            "No se ha configurado una carpeta para grabaciones. Por favor, configura una carpeta en la configuración de Google Drive.",
          )
        }
      } catch (error) {
        console.error("Error al verificar el estado de Google Drive:", error)
        setIsGoogleDriveConfigured(false)
        setErrorMessage("Error al verificar la configuración de Google Drive.")
      } finally {
        setIsCheckingGoogleDrive(false)
      }
    }

    checkGoogleDriveStatus()
  }, [])

  const startRecording = async () => {
    try {
      setErrorMessage(null)

      if (!isGoogleDriveConfigured) {
        setErrorMessage(
          "Google Drive no está configurado correctamente. Por favor, configura tu cuenta de Google Drive.",
        )
        return
      }

      // Crear la reunión primero
      if (!meetingId) {
        await createMeeting()
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)

      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.start(1000)
      setIsRecording(true)
      setIsPaused(false)

      // Iniciar el temporizador
      timerRef.current = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1000)
      }, 1000)
    } catch (error) {
      console.error("Error al iniciar la grabación:", error)
      setErrorMessage(
        "Error al iniciar la grabación. Asegúrate de que el micrófono esté conectado y hayas dado permiso para usarlo.",
      )
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause()
      setIsPaused(true)

      // Pausar el temporizador
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume()
      setIsPaused(false)

      // Reanudar el temporizador
      timerRef.current = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1000)
      }, 1000)
    }
  }

  const stopRecording = async () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()

      // Detener el temporizador
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      // Esperar a que se procesen todos los datos
      mediaRecorderRef.current.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })

          if (audioBlob.size > 0) {
            await uploadAudioToGoogleDrive(audioBlob)
          } else {
            setErrorMessage("La grabación está vacía. Por favor, intenta grabar de nuevo.")
          }

          // Detener todas las pistas de audio
          mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop())

          setIsRecording(false)
          setIsPaused(false)
        } catch (error) {
          console.error("Error al procesar la grabación:", error)
          setErrorMessage("Error al procesar la grabación.")
          setIsRecording(false)
          setIsPaused(false)
        }
      }
    }
  }

  const createMeeting = async () => {
    if (!title.trim()) {
      setErrorMessage("Por favor, ingresa un título para la reunión.")
      return
    }

    try {
      setIsCreatingMeeting(true)
      setErrorMessage(null)

      const response = await fetch("/api/meetings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error(`Error al crear la reunión: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setMeetingId(data.meetingId)
        toast({
          title: "Reunión creada",
          description: "La reunión se ha creado correctamente.",
        })

        if (onMeetingCreated) {
          onMeetingCreated(data.meetingId)
        }

        return data.meetingId
      } else {
        throw new Error(data.message || "Error al crear la reunión")
      }
    } catch (error) {
      console.error("Error al crear la reunión:", error)
      setErrorMessage(`Error al crear la reunión: ${error.message}`)
      return null
    } finally {
      setIsCreatingMeeting(false)
    }
  }

  const uploadAudioToGoogleDrive = async (audioBlob: Blob) => {
    if (!meetingId) {
      setErrorMessage("No se ha creado una reunión. Por favor, crea una reunión primero.")
      return
    }

    try {
      setIsUploading(true)
      setUploadProgress(0)
      setErrorMessage(null)

      // Crear un nombre de archivo basado en el ID de la reunión
      const fileName = `${meetingId}_${title.replace(/[^a-zA-Z0-9]/g, "_")}.webm`

      // Crear un FormData para enviar el archivo
      const formData = new FormData()
      formData.append("audio", audioBlob, fileName)
      formData.append("meetingId", meetingId)
      formData.append("fileName", fileName)

      // Simular progreso de carga
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + Math.random() * 10
          return newProgress > 90 ? 90 : newProgress
        })
      }, 500)

      // Enviar el archivo a Google Drive
      const response = await fetch("/api/upload/meeting-audio", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)

      // Verificar si la respuesta es exitosa
      if (!response.ok) {
        // Incluso si hay un error HTTP, intentamos leer el cuerpo de la respuesta
        const errorData = await response.json().catch(() => ({ error: "Error desconocido" }))

        // Verificar si el archivo se subió a pesar del error
        if (errorData.fileId) {
          // El archivo se subió correctamente a pesar del error HTTP
          setUploadProgress(100)

          toast({
            title: "Grabación completada",
            description: "El audio se ha subido a Google Drive correctamente.",
          })

          if (onRecordingComplete && errorData.downloadLink) {
            onRecordingComplete(errorData.downloadLink, meetingId)
          }

          // Reiniciar el estado
          setTimeout(() => {
            setRecordingTime(0)
            setUploadProgress(0)
            setIsUploading(false)
          }, 2000)

          return
        }

        // Si llegamos aquí, es un error real
        throw new Error(errorData.error || errorData.details || `Error ${response.status}`)
      }

      // Procesar la respuesta exitosa
      const data = await response.json()

      setUploadProgress(100)

      toast({
        title: "Grabación completada",
        description: "El audio se ha subido a Google Drive correctamente.",
      })

      if (onRecordingComplete && data.downloadLink) {
        onRecordingComplete(data.downloadLink, meetingId)
      }

      // Reiniciar el estado
      setTimeout(() => {
        setRecordingTime(0)
        setUploadProgress(0)
        setIsUploading(false)
      }, 2000)
    } catch (error) {
      console.error("Error al subir el audio a Google Drive:", error)

      // Verificar si el archivo se subió a pesar del error
      try {
        const checkResponse = await fetch(`/api/meetings/${meetingId}`)
        const meetingData = await checkResponse.json()

        if (meetingData.google_drive_id) {
          // El archivo se subió correctamente a pesar del error
          setUploadProgress(100)

          toast({
            title: "Grabación completada",
            description: "El audio se ha subido a Google Drive correctamente, a pesar de algunos errores.",
          })

          if (onRecordingComplete && meetingData.audio_url) {
            onRecordingComplete(meetingData.audio_url, meetingId)
          }

          // Reiniciar el estado
          setTimeout(() => {
            setRecordingTime(0)
            setUploadProgress(0)
            setIsUploading(false)
          }, 2000)

          return
        }
      } catch (checkError) {
        console.error("Error al verificar si el archivo se subió:", checkError)
      }

      // Si llegamos aquí, es un error real
      setErrorMessage(`Error al subir el audio a Google Drive: ${error.message}`)
      setIsUploading(false)
    }
  }

  const resetRecording = () => {
    setRecordingTime(0)
    setIsRecording(false)
    setIsPaused(false)
    setIsUploading(false)
    setUploadProgress(0)
    setErrorMessage(null)

    // Detener todas las pistas de audio si hay alguna activa
    if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
    }

    // Detener el temporizador si está activo
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Grabar reunión</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isCheckingGoogleDrive ? (
          <div className="text-center py-4">
            <p>Verificando configuración de Google Drive...</p>
          </div>
        ) : !isGoogleDriveConfigured ? (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
            <p>
              {errorMessage ||
                "Google Drive no está configurado correctamente. Por favor, configura tu cuenta de Google Drive."}
            </p>
            <Button variant="outline" className="mt-2" onClick={() => (window.location.href = "/google-drive-setup")}>
              Configurar Google Drive
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="title">Título de la reunión</Label>
              <Input
                id="title"
                placeholder="Ingresa un título"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isRecording || isCreatingMeeting || isUploading || !!meetingId}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Ingresa una descripción"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isRecording || isCreatingMeeting || isUploading || !!meetingId}
              />
            </div>

            {!meetingId && !isRecording && (
              <Button
                onClick={createMeeting}
                disabled={!title.trim() || isCreatingMeeting || isUploading}
                className="w-full"
              >
                {isCreatingMeeting ? "Creando reunión..." : "Crear reunión"}
              </Button>
            )}

            {meetingId && (
              <div className="text-center py-2">
                <p className="text-sm text-gray-500">ID de reunión: {meetingId}</p>
              </div>
            )}

            {isRecording && (
              <div className="text-center py-4">
                <p className="text-xl font-bold">{formatTime(recordingTime)}</p>
                <p className="text-sm text-gray-500">{isPaused ? "Grabación pausada" : "Grabando..."}</p>
              </div>
            )}

            {isUploading && (
              <div className="space-y-2">
                <p className="text-sm text-center">Subiendo grabación a Google Drive...</p>
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-right">{Math.round(uploadProgress)}%</p>
              </div>
            )}

            {errorMessage && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
                <p>{errorMessage}</p>
              </div>
            )}
          </>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        {!isRecording && !isUploading && meetingId && (
          <Button
            onClick={startRecording}
            disabled={isUploading || !isGoogleDriveConfigured || isCheckingGoogleDrive}
            className="bg-red-500 hover:bg-red-600"
          >
            Iniciar grabación
          </Button>
        )}

        {isRecording && !isPaused && (
          <Button onClick={pauseRecording} variant="outline">
            Pausar
          </Button>
        )}

        {isRecording && isPaused && (
          <Button onClick={resumeRecording} variant="outline">
            Reanudar
          </Button>
        )}

        {isRecording && (
          <Button onClick={stopRecording} disabled={isUploading} className="bg-gray-500 hover:bg-gray-600">
            Detener grabación
          </Button>
        )}

        {!isRecording && !isUploading && (
          <Button
            onClick={resetRecording}
            variant="outline"
            disabled={isUploading || (!isRecording && recordingTime === 0 && !meetingId)}
          >
            Reiniciar
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
