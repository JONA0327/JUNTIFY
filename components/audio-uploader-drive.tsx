"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Upload, AlertCircle, Lock } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import { getUsername } from "@/utils/user-helpers"

interface AudioUploaderDriveProps {
  onFileSelected: (audioData: any) => void
  disabled: boolean
  meetingId?: string
}

export function AudioUploaderDrive({ onFileSelected, disabled, meetingId }: AudioUploaderDriveProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const isMobile = useMobile()

  // Añadir un nuevo estado para el progreso de carga
  const [uploadProgress, setUploadProgress] = useState(0)

  const validateAudioFile = (file: File) => {
    // Verificar el tipo de archivo
    const validTypes = [
      "audio/mp3",
      "audio/mpeg",
      "audio/wav",
      "audio/x-wav",
      "audio/m4a",
      "audio/x-m4a",
      "audio/flac",
      "audio/ogg",
      "audio/aac",
    ]

    // Aceptar cualquier tipo de audio si no podemos determinar el tipo específico
    if (!file.type.startsWith("audio/") && !validTypes.includes(file.type)) {
      setError("Formato de archivo no soportado. Por favor, sube un archivo de audio.")
      return false
    }

    // Verificar el tamaño (máximo 100MB)
    const maxSize = 100 * 1024 * 1024 // 100MB en bytes
    if (file.size > maxSize) {
      setError("El archivo es demasiado grande. El tamaño máximo permitido es 100MB.")
      return false
    }

    setError(null)
    return true
  }

  const uploadToGoogleDrive = async (file: File) => {
    try {
      setIsUploading(true)
      setUploadProgress(0)

      // Verificar la duración del audio antes de subir
      const audioUrl = URL.createObjectURL(file)
      const audio = new Audio(audioUrl)

      // Esperar a que se carguen los metadatos para obtener la duración
      await new Promise<void>((resolve, reject) => {
        audio.onloadedmetadata = () => {
          if (audio.duration > 7200) {
            // 2 horas = 7200 segundos
            setError("El audio excede la duración máxima permitida de 2 horas.")
            setIsUploading(false)
            reject(new Error("Duración excedida"))
          } else {
            resolve()
          }
        }
        audio.onerror = () => {
          reject(new Error("Error al cargar el audio"))
        }
      })

      const username = getUsername()
      if (!username) {
        throw new Error("Debes iniciar sesión para subir archivos")
      }

      const formData = new FormData()
      formData.append("audio", file)

      // Si hay un ID de reunión, incluirlo en la solicitud
      if (meetingId) {
        formData.append("meetingId", meetingId)
      }

      // Iniciar el simulador de progreso
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval)
            return 95
          }
          return prev + 5
        })
      }, 500)

      const response = await fetch("/api/upload/google-drive", {
        method: "POST",
        headers: {
        },
        body: formData,
      })

      // Limpiar el intervalo y establecer el progreso al 100% cuando la respuesta está lista
      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Error al subir archivo a Google Drive")
      }

      const result = await response.json()

      // Crear un objeto URL temporal para obtener la duración
      const duration = Math.round(audio.duration)

      return {
        id: result.fileId,
        url: result.downloadLink,
        blob: file,
        duration: duration,
        name: file.name,
        googleDriveId: result.fileId,
        googleDriveLink: result.webViewLink,
      }
    } catch (err) {
      console.error("Error al subir a Google Drive:", err)
      throw err
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled || isUploading) return

    const file = e.target.files?.[0]
    if (file) {
      if (validateAudioFile(file)) {
        setSelectedFile(file)

        try {
          const audioData = await uploadToGoogleDrive(file)
          onFileSelected(audioData)
        } catch (err) {
          console.error("Error al procesar el archivo:", err)
          setError(`Error al procesar el archivo: ${err instanceof Error ? err.message : "Error desconocido"}`)
        }
      }
    }
  }

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    if (disabled || isUploading) return

    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    if (disabled || isUploading) return

    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (validateAudioFile(file)) {
        setSelectedFile(file)

        try {
          const audioData = await uploadToGoogleDrive(file)
          onFileSelected(audioData)
        } catch (err) {
          console.error("Error al procesar el archivo:", err)
          setError(`Error al procesar el archivo: ${err instanceof Error ? err.message : "Error desconocido"}`)
        }
      }
    }
  }

  const triggerFileInput = () => {
    if (!disabled && !isUploading && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className="bg-blue-800/30 border border-blue-700/30 rounded-lg p-4 sm:p-6">
      <div
        className={`border-2 border-dashed rounded-lg p-4 sm:p-8 text-center ${
          dragActive
            ? "border-blue-500 bg-blue-600/20"
            : disabled || isUploading
              ? "border-gray-700/50 opacity-60"
              : "border-blue-700/50"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="audio/*"
          className="hidden"
          disabled={disabled || isUploading}
        />

        <Upload
          className={`h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 ${
            disabled || isUploading ? "text-gray-400" : "text-blue-400"
          }`}
        />

        <h3 className="text-base sm:text-lg font-medium text-white mb-2">
          {selectedFile
            ? selectedFile.name
            : isUploading
              ? "Subiendo archivo a Google Drive..."
              : "Arrastra y suelta tu archivo de audio aquí"}
        </h3>

        <p className="text-xs sm:text-sm text-blue-300/70 mb-3 sm:mb-4">
          {selectedFile
            ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
            : "O haz clic para seleccionar un archivo"}
        </p>

        <div className="text-xs text-blue-300/70 mb-3 sm:mb-4">
          Formatos soportados: MP3, WAV, M4A, FLAC, OGG, AAC
          <div className="mt-2 text-blue-200">El archivo se almacenará en Google Drive</div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-3 sm:mb-4 bg-red-900/50 border-red-800 text-white">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {disabled && (
          <Alert className="mb-3 sm:mb-4 bg-amber-900/50 border-amber-800 text-white">
            <Lock className="h-4 w-4" />
            <AlertTitle>Límite alcanzado</AlertTitle>
            <AlertDescription>
              Has alcanzado el límite de 5 transcripciones este mes. Vuelve el próximo mes para continuar.
            </AlertDescription>
          </Alert>
        )}

        {isUploading ? (
          <>
            <div className="w-full bg-blue-800/50 h-1 rounded-full mb-2">
              <div
                className="bg-blue-500 h-1 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <Button
              variant="outline"
              className="border-blue-600/50 text-blue-300 hover:bg-blue-800/30 cursor-not-allowed w-full"
              disabled={true}
            >
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-300 mr-2"></div>
              Subiendo... {uploadProgress}%
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            className={`${
              disabled
                ? "border-gray-600/50 text-gray-300 hover:bg-gray-800/30 cursor-not-allowed"
                : "border-blue-600/50 text-blue-300 hover:bg-blue-800/30"
            } ${isMobile ? "w-full" : ""}`}
            onClick={triggerFileInput}
            disabled={disabled}
          >
            Seleccionar archivo
          </Button>
        )}
      </div>
    </div>
  )
}
