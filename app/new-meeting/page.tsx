"use client"

import { useState, useRef, useEffect, useMemo } from "react"

import { NewNavbar } from "@/components/new-navbar"
import {
  Mic,
  Upload,
  Video,
  Play,
  Pause,
  Square,
  Settings,
  Save,
  Check,
  Loader,
  Calendar,
  Clock,
  MessageSquare,
  Search,
  AlertCircle,
  Lock,
  CloudUpload,
  ExternalLink,
  Download,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Dialog, DialogContent, DialogDescription,DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { MeetingRecorder } from "@/components/meeting-recorder"
import { useMobile } from "@/hooks/use-mobile"
import { LongAudioRecorder } from "@/components/long-audio-recorder"
import AnalyzerTypeSelector from "@/components/analyzer-type-selector"
import type { AnalyzerType } from "@/utils/analyzers"
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Edit2 } from "lucide-react";

// Lista de idiomas soportados
const supportedLanguages = [
  { value: "en", label: "Inglés" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Francés" },
  { value: "de", label: "Alemán" },
  { value: "it", label: "Italiano" },
  { value: "pt", label: "Portugués" },
  { value: "nl", label: "Holandés" },
  { value: "ru", label: "Ruso" },
  { value: "zh", label: "Chino" },
  { value: "ja", label: "Japonés" },
  { value: "ko", label: "Coreano" },
]

// Función para detectar si el dispositivo es iOS
const isIOS = () => {
  if (typeof window === "undefined") return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
}

// Componente para la grabación de audio
const AudioRecorder = ({ onRecordingComplete, audioSettings, disabled }) => {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState(null)
  const [error, setError] = useState(null)
  const [audioData, setAudioData] = useState([])
  const isMobile = useMobile()

  const timerRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const audioChunksRef = useRef([])

  // Iniciar la grabación de audio
  const startRecording = async () => {
    try {
      setError(null)

      // Obtener acceso al micrófono
      const constraints = {
        audio: {
          deviceId: audioSettings.selectedMic !== "default" ? { exact: audioSettings.selectedMic } : undefined,
          echoCancellation: true,
          noiseSuppression: audioSettings.noiseReduction !== "off",
          autoGainControl: true,
        },
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      // Configurar el MediaRecorder con la calidad seleccionada
      const mimeType = "audio/webm;codecs=opus"
      let bitrate = 128000 // Por defecto (medium)

      switch (audioSettings.quality) {
        case "low":
          bitrate = 32000
          break
        case "high":
          bitrate = 256000
          break
      }

      const options = {
        mimeType,
        audioBitsPerSecond: bitrate,
      }

      // Intentar crear el MediaRecorder con las opciones especificadas
      let mediaRecorder
      try {
        mediaRecorder = new MediaRecorder(stream, options)
      } catch (e) {
        // Si falla, intentar con opciones predeterminadas
        console.warn(
          "No se pudo crear MediaRecorder con las opciones especificadas, usando configuración predeterminada",
          e,
        )
        mediaRecorder = new MediaRecorder(stream)
      }
      mediaRecorderRef.current = mediaRecorder

      // Manejar los datos grabados
      audioChunksRef.current = []
      mediaRecorder.ondataavailable = (e) => {
        console.log("Datos disponibles:", e.data.size)
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      // Cuando la grabación se detiene
      mediaRecorder.onstop = () => {
        console.log("MediaRecorder detenido, procesando datos...")
        if (audioChunksRef.current.length === 0) {
          setError("No se capturaron datos de audio. Intenta grabar de nuevo.")
          return
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
        console.log("Blob creado, tamaño:", audioBlob.size)
        setAudioBlob(audioBlob)

        // Siempre procesar el audio, sin importar el umbral de detección
        if (audioBlob.size > 0) {
          saveAudioLocally(audioBlob)
        } else {
          setError("El archivo de audio está vacío. Intenta grabar de nuevo.")
        }
      }

      // Iniciar la grabación
      mediaRecorder.start(100) // Recoger datos cada 100ms
      setIsRecording(true)
      setIsPaused(false)
      setRecordingTime(0)

      // Iniciar el temporizador
      timerRef.current = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1)
      }, 1000)
    } catch (err) {
      console.error("Error al iniciar la grabación:", err)
      setError(`Error al acceder al micrófono: ${err.message}`)
    }
  }

  // Guardar el audio localmente
  const saveAudioLocally = async (blob) => {
    try {
      // Crear un objeto URL para acceso local
      const audioUrl = URL.createObjectURL(blob)

      // Generar un ID único para el audio
      const audioId = `audio_${Date.now()}`

      // Guardar el audio en localStorage como base64 (para archivos pequeños)
      // o simplemente guardar la referencia para archivos grandes
      try {
        // Convertir el blob a base64 solo para verificar que es válido
        const reader = new FileReader()
        reader.readAsDataURL(blob)
        reader.onloadend = () => {
          // Verificar que tenemos datos válidos
          if (reader.result) {
            console.log("Audio grabado correctamente, tamaño:", blob.size)

            // Guardar referencia en localStorage
            localStorage.setItem("lastAudioId", audioId)

            // Notificar que la grabación está lista para procesar
            onRecordingComplete({
              id: audioId,
              url: audioUrl,
              blob: blob,
              duration: recordingTime,
              size: blob.size,
            })
          } else {
            throw new Error("No se pudo leer el audio grabado")
          }
        }
      } catch (e) {
        console.error("Error al procesar el audio:", e)
        setError("Error al procesar el audio grabado. Intenta una grabación más corta.")
        throw e
      }
    } catch (err) {
      console.error("Error al guardar el audio:", err)
      setError(`Error al guardar el audio: ${err.message}`)
      throw err
    }
  }

  // Detener la grabación
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        // Asegurarse de que hay datos para grabar
        if (audioChunksRef.current.length === 0) {
          // Forzar la obtención de los datos actuales antes de detener
          mediaRecorderRef.current.requestData()
        }

        // Detener la grabación
        mediaRecorderRef.current.stop()
        clearInterval(timerRef.current)
        setIsRecording(false)
        setIsPaused(false)

        // Detener y liberar el stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
        }

        console.log("Grabación detenida, chunks:", audioChunksRef.current.length)
      } catch (err) {
        console.error("Error al detener la grabación:", err)
        setError(`Error al detener la grabación: ${err.message}`)
      }
    }
  }

  // Pausar la grabación
  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.pause()
        clearInterval(timerRef.current)
        setIsPaused(true)
      }
    }
  }

  // Reanudar la grabación
  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume()
      timerRef.current = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1)
      }, 1000)
      setIsPaused(false)
    }
  }

  // Formatear el tiempo de grabación
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  // Limpiar recursos cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  return (
    <div className="bg-blue-800/30 border border-blue-700/30 rounded-lg p-4 sm:p-6">
      <div className="flex flex-col items-center">
        <div className="mb-4 sm:mb-6 relative">
          <div
            className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full flex items-center justify-center ${
              isRecording
                ? isPaused
                  ? "bg-yellow-600/30"
                  : "bg-red-600/30"
                : disabled
                  ? "bg-gray-600/30"
                  : "bg-blue-600/30"
            }`}
          >
            <Mic
              className={`h-12 w-12 sm:h-16 sm:w-16 ${
                isRecording
                  ? isPaused
                    ? "text-yellow-400"
                    : "text-red-400"
                  : disabled
                    ? "text-gray-400"
                    : "text-blue-400"
              }`}
            />
          </div>
          <div className="mt-4 text-center">
            <div className="text-xl sm:text-2xl font-bold text-white">{formatTime(recordingTime)}</div>
            <div className="text-blue-300/70 text-xs sm:text-sm">
              {isRecording
                ? isPaused
                  ? "Grabación pausada"
                  : "Grabando..."
                : disabled
                  ? "Límite de grabaciones alcanzado"
                  : "Listo para grabar"}
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4 bg-red-900/50 border-red-800 text-white">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {disabled && (
          <Alert className="mb-4 bg-amber-900/50 border-amber-800 text-white">
            <Lock className="h-4 w-4" />
            <AlertTitle>Límite alcanzado</AlertTitle>
            <AlertDescription>
              Has alcanzado el límite de 50 transcripciones este mes. Vuelve el próximo mes para continuar.
            </AlertDescription>
          </Alert>
        )}

        <div className={`flex ${isMobile ? "flex-col w-full" : "flex-row"} gap-3`}>
          {!isRecording ? (
            <Button
              className={`${
                disabled ? "bg-gray-600 hover:bg-gray-700 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              } text-white ${isMobile ? "w-full" : ""}`}
              onClick={startRecording}
              disabled={disabled}
            >
              <Play className="h-4 w-4 mr-2" />
              Iniciar grabación
            </Button>
          ) : (
            <>
              {!isPaused ? (
                <Button
                  variant="outline"
                  className={`border-yellow-600/50 text-yellow-400 hover:bg-yellow-800/30 ${isMobile ? "w-full" : ""}`}
                  onClick={pauseRecording}
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pausar
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className={`border-blue-600/50 text-blue-400 hover:bg-blue-800/30 ${isMobile ? "w-full" : ""}`}
                  onClick={resumeRecording}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Continuar
                </Button>
              )}
              <Button
                variant="outline"
                className={`border-red-600/50 text-red-400 hover:bg-red-800/30 ${isMobile ? "w-full" : ""}`}
                onClick={stopRecording}
              >
                <Square className="h-4 w-4 mr-2" />
                Detener
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Componente para subir archivos de audio
const AudioUploader = ({ onFileSelected, disabled }) => {
  const fileInputRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioRecorder, setAudioRecorder] = useState(null)
  const [audioChunks, setAudioChunks] = useState([])
  const isMobile = useMobile()
  const isIOSDevice = isIOS()

  // Timer para la grabación
  const timerRef = useRef(null)

  const validateAudioFile = (file) => {
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

  const handleFileChange = (e) => {
    if (disabled) return

    const file = e.target.files[0]
    if (file) {
      if (validateAudioFile(file)) {
        setSelectedFile(file)

        // Crear un objeto URL para el archivo
        const audioUrl = URL.createObjectURL(file)

        // Obtener la duración del audio
        const audio = new Audio(audioUrl)
        audio.onloadedmetadata = () => {
          const duration = Math.round(audio.duration)

          // Verificar la duración máxima (2 horas = 7200 segundos)
          if (duration > 7200) {
            setError("El audio excede la duración máxima permitida de 2 horas.")
            return
          }

          onFileSelected({
            id: `audio_${Date.now()}`,
            url: audioUrl,
            blob: file,
            duration: duration,
            name: file.name,
          })
        }
      }
    }
  }

  const handleDrag = (e) => {
    if (disabled) return

    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    if (disabled) return

    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (validateAudioFile(file)) {
        setSelectedFile(file)

        // Crear un objeto URL para el archivo
        const audioUrl = URL.createObjectURL(file)

        // Obtener la duración del audio
        const audio = new Audio(audioUrl)
        audio.onloadedmetadata = () => {
          const duration = Math.round(audio.duration)

          // Verificar la duración máxima (2 horas = 7200 segundos)
          if (duration > 7200) {
            setError("El audio excede la duración máxima permitida de 2 horas.")
            return
          }

          onFileSelected({
            id: `audio_${Date.now()}`,
            url: audioUrl,
            blob: file,
            duration: duration,
            name: file.name,
          })
        }
      }
    }
  }

  const triggerFileInput = () => {
    if (!disabled) {
      if (isIOSDevice) {
        // En iOS, iniciamos la grabación directamente
        startRecording()
      } else {
        fileInputRef.current.click()
      }
    }
  }

  // Iniciar grabación (para iOS)
  const startRecording = async () => {
    try {
      setError(null)

      // Verificar si el navegador soporta MediaRecorder
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Tu navegador no soporta la grabación de audio. Intenta con otro navegador.")
        return
      }

      // Obtener acceso al micrófono
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Crear el MediaRecorder
      const recorder = new MediaRecorder(stream)
      setAudioRecorder(recorder)

      // Limpiar chunks anteriores
      setAudioChunks([])

      // Configurar el evento de datos disponibles
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          setAudioChunks((prev) => [...prev, e.data])
        }
      }

      // Configurar el evento de finalización
      recorder.onstop = () => {
        // Detener todos los tracks del stream
        stream.getTracks().forEach((track) => track.stop())

        // Crear el blob de audio
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" })

        // Crear URL para el blob
        const audioUrl = URL.createObjectURL(audioBlob)

        // Notificar que la grabación está lista
        onFileSelected({
          id: `audio_${Date.now()}`,
          url: audioUrl,
          blob: audioBlob,
          duration: recordingTime,
          name: `grabacion_${Date.now()}.wav`,
        })

        // Resetear estado
        setIsRecording(false)
        setRecordingTime(0)
        clearInterval(timerRef.current)
      }

      // Iniciar la grabación
      recorder.start()
      setIsRecording(true)

      // Iniciar el temporizador
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      console.error("Error al iniciar la grabación:", err)
      setError(`Error al acceder al micrófono: ${err.message}`)
    }
  }

  // Detener grabación (para iOS)
  const stopRecording = () => {
    if (audioRecorder && audioRecorder.state !== "inactive") {
      audioRecorder.stop()
      clearInterval(timerRef.current)
    }
  }

  // Formatear el tiempo de grabación
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  // Limpiar recursos cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (audioRecorder && audioRecorder.state !== "inactive") {
        audioRecorder.stop()
      }
    }
  }, [audioRecorder])

  return (
    <div className="bg-blue-800/30 border border-blue-700/30 rounded-lg p-4 sm:p-6">
      {isIOSDevice && isRecording ? (
        // Interfaz de grabación para iOS
        <div className="flex flex-col items-center">
          <div className="mb-4 text-center">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-red-600/30 animate-pulse flex items-center justify-center mx-auto mb-4">
              <Mic className="h-12 w-12 sm:h-16 sm:w-16 text-red-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white">{formatTime(recordingTime)}</div>
            <div className="text-blue-300/70 text-xs sm:text-sm">Grabando...</div>
          </div>

          <Button
            variant="outline"
            className={`border-red-600/50 text-red-400 hover:bg-red-800/30 ${isMobile ? "w-full" : ""}`}
            onClick={stopRecording}
          >
            <Square className="h-4 w-4 mr-2" />
            Detener grabación
          </Button>
        </div>
      ) : (
        // Interfaz normal para subir archivos o iniciar grabación en iOS
        <div
          className={`border-2 border-dashed rounded-lg p-4 sm:p-8 text-center ${
            dragActive
              ? "border-blue-500 bg-blue-600/20"
              : disabled
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
            accept="audio/mp3,audio/mpeg,audio/wav,audio/x-wav,audio/m4a,audio/x-m4a,audio/flac,audio/ogg,audio/aac"
            className="hidden"
            disabled={disabled}
          />

          <Upload
            className={`h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 ${disabled ? "text-gray-400" : "text-blue-400"}`}
          />

          <h3 className="text-base sm:text-lg font-medium text-white mb-2">
            {selectedFile
              ? selectedFile.name
              : isIOSDevice
                ? "Graba audio directamente"
                : "Arrastra y suelta tu archivo de audio aquí"}
          </h3>

          <p className="text-xs sm:text-sm text-blue-300/70 mb-3 sm:mb-4">
            {selectedFile
              ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
              : isIOSDevice
                ? "Toca el botón para iniciar la grabación"
                : "O haz clic para seleccionar un archivo de audio"}
          </p>

          <div className="text-xs text-blue-300/70 mb-3 sm:mb-4">
            Formatos soportados: MP3, WAV, M4A, FLAC, OGG, AAC
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
                Has alcanzado el límite de 50 transcripciones este mes. Vuelve el próximo mes para continuar.
              </AlertDescription>
            </Alert>
          )}

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
            {isIOSDevice ? "Grabar audio" : "Seleccionar archivo"}
          </Button>
        </div>
      )}
    </div>
  )
}

// Componente para las opciones avanzadas
const AdvancedOptions = ({ settings, onSettingsChange, supportedFeatures }) => {
  const isMobile = useMobile()

  const handleMicSensitivityChange = (values) => {
    onSettingsChange({ ...settings, sensitivity: values[0] })
  }

  const handleMicChange = (value) => {
    onSettingsChange({ ...settings, selectedMic: value })
  }

  const handleQualityChange = (value) => {
    onSettingsChange({ ...settings, quality: value })
  }

  const handleNoiseReductionChange = (value) => {
    onSettingsChange({ ...settings, noiseReduction: value })
  }

  const handleLanguageChange = (value) => {
    onSettingsChange({ ...settings, language: value })
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="advanced-options" className="border-blue-700/30">
        <AccordionTrigger className="text-white hover:text-blue-300 px-2 py-3">
          <div className="flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Opciones avanzadas
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-5 py-2 px-2">
            {/* Idioma de transcripción */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-blue-200">Idioma de transcripción</label>
              <Select value={settings.language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="bg-blue-700/40 border border-blue-600/50 text-white">
                  <SelectValue placeholder="Seleccionar idioma" />
                </SelectTrigger>
                <SelectContent className="bg-blue-800/90 border border-blue-700/50 max-h-[300px]">
                  {supportedLanguages.map((language) => (
                    <SelectItem key={language.value} value={language.value} className="text-white">
                      {language.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-blue-200">Dispositivo de micrófono</label>
              <Select
                value={settings.selectedMic}
                onValueChange={handleMicChange}
                disabled={!supportedFeatures.deviceSelection}
              >
                <SelectTrigger
                  className={`bg-blue-700/40 border border-blue-600/50 text-white ${!supportedFeatures.deviceSelection ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <SelectValue placeholder="Seleccionar micrófono" />
                </SelectTrigger>
                <SelectContent className="bg-blue-800/90 border border-blue-700/50">
                  {settings.availableMics.map((mic) => (
                    <SelectItem key={mic.deviceId} value={mic.deviceId} className="text-white">
                      {mic.label || `Micrófono ${mic.deviceId.slice(0, 5)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!supportedFeatures.deviceSelection && (
                <p className="text-xs text-yellow-300">
                  La selección de dispositivos no está disponible en este navegador.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-blue-200">Sensibilidad del micrófono</label>
                <span className="text-sm text-blue-300">{settings.sensitivity}%</span>
              </div>
              <Slider
                value={[settings.sensitivity]}
                onValueChange={handleMicSensitivityChange}
                min={0}
                max={100}
                step={1}
                className="w-full"
                disabled={!supportedFeatures.sensitivity}
              />
              <div className="flex justify-between text-xs text-blue-300/70">
                <span>Baja</span>
                <span>Alta</span>
              </div>
              {!supportedFeatures.sensitivity && (
                <p className="text-xs text-yellow-300">
                  El ajuste de sensibilidad no está disponible en este navegador.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-blue-200">Calidad de grabación</label>
              <Select
                value={settings.quality}
                onValueChange={handleQualityChange}
                disabled={!supportedFeatures.quality}
              >
                <SelectTrigger
                  className={`bg-blue-700/40 border border-blue-600/50 text-white ${!supportedFeatures.quality ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <SelectValue placeholder="Seleccionar calidad" />
                </SelectTrigger>
                <SelectContent className="bg-blue-800/90 border border-blue-700/50">
                  <SelectItem value="low" className="text-white">
                    Baja (32 kbps)
                  </SelectItem>
                  <SelectItem value="medium" className="text-white">
                    Media (128 kbps)
                  </SelectItem>
                  <SelectItem value="high" className="text-white">
                    Alta (256 kbps)
                  </SelectItem>
                </SelectContent>
              </Select>
              {!supportedFeatures.quality && (
                <p className="text-xs text-yellow-300">El ajuste de calidad no está disponible en este navegador.</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-blue-200">Reducción de ruido</label>
              <Select
                value={settings.noiseReduction}
                onValueChange={handleNoiseReductionChange}
                disabled={!supportedFeatures.noiseReduction}
              >
                <SelectTrigger
                  className={`bg-blue-700/40 border border-blue-600/50 text-white ${!supportedFeatures.noiseReduction ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <SelectValue placeholder="Seleccionar nivel" />
                </SelectTrigger>
                <SelectContent className="bg-blue-800/90 border border-blue-700/50">
                  <SelectItem value="off" className="text-white">
                    Desactivado
                  </SelectItem>
                  <SelectItem value="low" className="text-white">
                    Bajo
                  </SelectItem>
                  <SelectItem value="medium" className="text-white">
                    Medio
                  </SelectItem>
                  <SelectItem value="high" className="text-white">
                    Alto
                  </SelectItem>
                  <SelectItem value="auto" className="text-white">
                    Automático
                  </SelectItem>
                </SelectContent>
              </Select>
              {!supportedFeatures.noiseReduction && (
                <p className="text-xs text-yellow-300">La reducción de ruido no está disponible en este navegador.</p>
              )}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

// Componente para el procesamiento de audio
const ProcessingSteps = ({ currentStep, progress }) => {
  const steps = [
    { id: "processing", label: "Procesando audio" },
    { id: "transcribing", label: "Generando transcripción" },
    { id: "analyzing", label: "Analizando contenido" },
  ]

  return (
    <div className="space-y-4 sm:space-y-6">
      {steps.map((step, index) => {
        const isActive = currentStep === step.id
        const isCompleted = steps.findIndex((s) => s.id === currentStep) > index

        return (
          <div key={step.id} className="space-y-2">
            <div className="flex items-center">
              <div
                className={`h-6 w-6 rounded-full flex items-center justify-center mr-3 ${
                  isCompleted ? "bg-green-500" : isActive ? "bg-blue-600" : "bg-blue-800/50"
                }`}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4 text-white" />
                ) : isActive ? (
                  <Loader className="h-4 w-4 text-white animate-spin" />
                ) : (
                  <span className="text-xs text-white">{index + 1}</span>
                )}
              </div>
              <span
                className={`font-medium ${
                  isCompleted ? "text-green-400" : isActive ? "text-white" : "text-blue-300/70"
                }`}
              >
                {step.label}
              </span>
              {isCompleted && <span className="ml-auto text-green-400 text-sm">Completado</span>}
              {isActive && <span className="ml-auto text-blue-300 text-sm">{progress}%</span>}
            </div>
            {isActive && <Progress value={progress} className="h-2 bg-blue-800/50" indicatorClassName="bg-blue-500" />}
          </div>
        )
      })}
    </div>
  )
}

// Componente para la transcripción
// Define el tipo de cada segmento de transcripción
// Define el tipo de cada segmento de transcripción
interface Segment {
  time: string;
  speaker: string;
  text: string;
}

interface TranscriptionViewProps {
  transcription: Segment[];
  onAnalyze: (editedTranscription: Segment[], speakerMap: Record<string, string>, analyzerType?: string) => void;
  onCancel: () => void;
}

export function TranscriptionView({
  transcription,
  onAnalyze,
  onCancel,
}: TranscriptionViewProps) {
  // Estado para el speakerMap global
  const [speakerMap, setSpeakerMap] = useState<Record<string, string>>({});
  // Estado para el diálogo de edición
  const [editingSpeakerKey, setEditingSpeakerKey] = useState<string>("");
  const [speakerName, setSpeakerName] = useState("");
  const [showSpeakerDialog, setShowSpeakerDialog] = useState(false);
  // Estado para el tipo de análisis
  const [selectedAnalyzerType, setSelectedAnalyzerType] = useState("standard");

  // Inicializar el speakerMap al cargar la transcripción
  useEffect(() => {
    if (transcription && transcription.length > 0) {
      const initialMap: Record<string, string> = {};
      transcription.forEach(seg => {
        if (seg.speaker && !initialMap[seg.speaker]) {
          initialMap[seg.speaker] = seg.speaker;
        }
      });
      setSpeakerMap(initialMap);
    }
  }, [transcription]);

  // Obtener todos los IDs de hablantes únicos
  const allSpeakers = Object.keys(speakerMap);

  // Colores para los badges (opcional)
  const palette = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-yellow-500",
    "bg-pink-500",
    "bg-orange-500",
    "bg-gray-500",
  ];
  const speakerColors: Record<string, string> = {};
  allSpeakers.forEach((s, idx) => {
    speakerColors[s] = palette[idx % palette.length];
  });

   
  // Abrir el diálogo de edición
  const handleEditSpeaker = (speakerId: string) => {
    setEditingSpeakerKey(speakerId);
    setSpeakerName(speakerMap[speakerId] || speakerId);
    setShowSpeakerDialog(true);
  };

  // Guardar el nombre editado
  const handleSaveSpeaker = () => {
    if (!speakerName.trim() || !editingSpeakerKey) return;
    setSpeakerMap(prev => ({ ...prev, [editingSpeakerKey]: speakerName.trim() }));
    setShowSpeakerDialog(false);
  };

  // Al analizar, se pasa la transcripción original y el speakerMap
const handleAnalyze = () => {
  // Aplica el speakerMap a cada segmento
  const mappedTranscription = transcription.map(seg => ({
    ...seg,
    speaker: speakerMap[seg.speaker] || seg.speaker,
  }));
  onAnalyze(mappedTranscription, speakerMap, selectedAnalyzerType);
};

return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-white">Transcripción</h3>
      </div>

      {/* Lista de hablantes para editar */}
      <div className="mb-4 flex flex-wrap gap-2">
        {allSpeakers.map((speakerId) => (
          <Badge
            key={speakerId}
            className={`text-white ${speakerColors[speakerId]} flex items-center`}
          >
            {speakerMap[speakerId]}
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 ml-2 text-blue-200"
              onClick={() => handleEditSpeaker(speakerId)}
            >
              <Edit2 className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
      </div>

      {/* Lista de segmentos */}
      <div className="bg-blue-800/30 border border-blue-700/30 rounded-lg p-3 sm:p-4 max-h-[300px] sm:max-h-[400px] overflow-y-auto">
        <div className="space-y-4 sm:space-y-6">
          {transcription.map((item, index) => (
            <div
              key={index}
              className="flex p-2 rounded-lg transition-colors"
            >
              <div className="w-16 sm:w-24 flex-shrink-0">
                <div className="text-xs sm:text-sm text-blue-300">
                  {item.time}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center font-medium text-white mb-1">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      speakerColors[item.speaker] || "bg-gray-500"
                    } mr-2`}
                  ></div>
                  {speakerMap[item.speaker] || item.speaker}
                </div>
                <div className="text-sm text-blue-100">{item.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selector de tipo de analizador y botones */}
      <div className="mt-6 mb-4">
        <h3 className="text-lg font-medium text-white mb-3">
          Selecciona el tipo de análisis
        </h3>
        <AnalyzerTypeSelector
          onSelect={setSelectedAnalyzerType}
          defaultValue="standard"
          disabled={false}
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          className="border-blue-600/50 text-blue-300 hover:bg-blue-800/30"
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={handleAnalyze}
        >
          Analizar
        </Button>
      </div>

      {/* Diálogo de edición de hablante */}
      <Dialog open={showSpeakerDialog} onOpenChange={setShowSpeakerDialog}>
        <DialogContent className="bg-blue-800 border-blue-700 text-white">
          <DialogHeader>
            <DialogTitle>Editar nombre de hablante</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={speakerName}
              onChange={(e) => setSpeakerName(e.target.value)}
              placeholder="Nombre del hablante"
              className="bg-blue-700/40 border-blue-600/50 text-white"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSpeakerDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveSpeaker} disabled={!speakerName.trim()}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
// Componente para el análisis de la reunión
const MeetingAnalysis = ({ analysis, onSave, onCancel, driveFileInfo }) => {
  const [activeTab, setActiveTab] = useState("summary")
  const [meetingTitle, setMeetingTitle] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const isMobile = useMobile()

  // Obtener el tipo de analizador de los metadatos
  const analyzerType = analysis.metadata?.analysisType || "standard"

  // Mapeo de tipos de analizador a nombres legibles
  const analyzerNames = {
    standard: "Análisis Estándar",
    business: "Análisis Empresarial",
    academic: "Análisis Académico",
    legal: "Análisis Legal",
    medical: "Análisis Médico",
  }

  const noContentMessage = (
    <div className="flex flex-col items-center justify-center p-4 sm:p-6 text-center">
      <div className="rounded-full bg-blue-800/40 p-2 sm:p-3 mb-3 sm:mb-4">
        <Search className="h-4 w-4 sm:h-6 sm:w-6 text-blue-300" />
      </div>
      <h3 className="text-base sm:text-lg font-medium text-white mb-1">Sin contenido</h3>
      <p className="text-xs sm:text-sm text-blue-300/70">No hay información disponible en este momento.</p>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Mostrar el tipo de analizador utilizado */}
      <div className="bg-blue-800/40 p-3 sm:p-4 rounded-lg mb-4 border border-blue-700/50">
        <h4 className="text-sm font-medium text-white mb-2 flex items-center">
          <FileText className="h-4 w-4 mr-2 text-blue-300" />
          Tipo de análisis: {analyzerNames[analyzerType] || "Análisis Estándar"}
        </h4>
      </div>

      {driveFileInfo && (
        <div className="bg-blue-800/40 p-3 sm:p-4 rounded-lg mb-4 border border-blue-700/50">
          <h4 className="text-sm font-medium text-white mb-2 flex items-center">
            <CloudUpload className="h-4 w-4 mr-2 text-blue-300" />
            Archivo guardado en Google Drive
          </h4>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
            <span className="text-blue-200">{driveFileInfo.fileName}</span>
            <div className="flex gap-2">
              {driveFileInfo.webViewLink && (
                <a
                  href={driveFileInfo.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 flex items-center"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Ver en Drive
                </a>
              )}
              {driveFileInfo.downloadUrl && (
                <a
                  href={driveFileInfo.downloadUrl}
                  download
                  className="text-blue-400 hover:text-blue-300 flex items-center"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Descargar
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Resto del componente sin cambios */}
      <Tabs defaultValue="summary" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-blue-800/30 w-full">
          <TabsTrigger value="summary" className="data-[state=active]:bg-blue-600 text-white text-xs sm:text-sm">
            Resumen
          </TabsTrigger>
          <TabsTrigger value="key-points" className="data-[state=active]:bg-blue-600 text-white text-xs sm:text-sm">
            Puntos Clave
          </TabsTrigger>
          <TabsTrigger value="tasks" className="data-[state=active]:bg-blue-600 text-white text-xs sm:text-sm">
            Tareas
          </TabsTrigger>
          <TabsTrigger value="action-items" className="data-[state=active]:bg-blue-600 text-white text-xs sm:text-sm">
            Acciones
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="summary" className="m-0">
            <div className="bg-blue-800/20 p-3 sm:p-4 rounded-lg">
              {analysis.summary ? (
                <p className="text-sm sm:text-base text-blue-100">{analysis.summary}</p>
              ) : (
                noContentMessage
              )}
            </div>
          </TabsContent>

          <TabsContent value="key-points" className="m-0">
            <div className="bg-blue-800/20 p-3 sm:p-4 rounded-lg">
              {analysis.keyPoints && analysis.keyPoints.length > 0 ? (
                <ul className="space-y-2">
                  {analysis.keyPoints.map((point, index) => (
                    <li key={index} className="flex items-start">
                      <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs flex-shrink-0 mr-2 sm:mr-3 mt-0.5">
                        {index + 1}
                      </div>
                      <span className="text-sm sm:text-base text-blue-100">{point}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                noContentMessage
              )}
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="m-0">
            <div className="bg-blue-800/20 p-3 sm:p-4 rounded-lg">
              {analysis.tasks && analysis.tasks.length > 0 ? (
                <ul className="space-y-3 sm:space-y-4">
                  {analysis.tasks.map((task) => (
                    <li key={task.id} className="flex items-start">
                      <div className="h-5 w-5 rounded border border-blue-500 flex-shrink-0 mr-2 sm:mr-3 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm sm:text-base text-white">{task.text}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center text-xs sm:text-sm text-blue-200/70 mt-1">
                          <span className="mr-0 sm:mr-3 mb-1 sm:mb-0">Asignado a: {task.assignee}</span>
                          <span>Fecha límite: {task.dueDate}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                noContentMessage
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>

      <div className="pt-4 border-t border-blue-700/30">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-blue-200">Título de la reunión</label>
            <input
              type="text"
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              placeholder="Ingresa un título para esta reunión"
              className="w-full bg-blue-700/40 border border-blue-600/50 text-white rounded-lg p-2 sm:p-2.5 text-sm"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center text-blue-200/70 text-xs sm:text-sm gap-2 sm:gap-0">
            <div className="flex items-center">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="mr-2 sm:mr-3">{format(new Date(), "dd MMM yyyy", { locale: es })}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span>{format(new Date(), "HH:mm", { locale: es })}</span>
            </div>
          </div>

          <div className={`flex ${isMobile ? "flex-col" : "justify-end"} gap-3`}>
            <Button
              variant="outline"
              className={`border-blue-600/50 text-blue-300 hover:bg-blue-800/30 ${isMobile ? "w-full" : ""}`}
              onClick={onCancel}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              className={`bg-blue-600 hover:bg-blue-700 text-white ${isMobile ? "w-full" : ""}`}
              onClick={() => onSave({ title: meetingTitle })}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Servicio para transcribir audio con Assembly AI
const transcribeAudio = async (audioFile, apiKey, settings) => {
  try {
    // Primero subimos el archivo a Assembly AI
    const uploadResponse = await fetch("https://api.assemblyai.com/v2/upload", {
      method: "POST",
      headers: {
        Authorization: apiKey,
      },
      body: audioFile,
    })

    if (!uploadResponse.ok) {
      throw new Error(`Error al subir el archivo: ${uploadResponse.status}`)
    }

    const uploadResult = await uploadResponse.json()
    const audioUrl = uploadResult.upload_url

    // Configurar opciones de transcripción con detección mejorada de hablantes
    // Usando solo parámetros válidos según la documentación de AssemblyAI v2
    const transcriptionOptions = {
      audio_url: audioUrl,
      speaker_labels: true,
      // Eliminamos speakers_expected para permitir detección automática
      filter_profanity: false,
      punctuate: true,
      format_text: true,
    }

    // Añadir idioma si está especificado
    if (settings.language && settings.language !== "auto") {
      transcriptionOptions.language_code = settings.language
    }

    console.log("Enviando opciones de transcripción:", JSON.stringify(transcriptionOptions))

    // Ahora iniciamos la transcripción con detección de hablantes
    const transcriptResponse = await fetch("https://api.assemblyai.com/v2/transcript", {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transcriptionOptions),
    })

    if (!transcriptResponse.ok) {
      const errorData = await transcriptResponse.json().catch(() => ({}))
      console.error("Error de AssemblyAI:", errorData)
      throw new Error(
        `Error al iniciar la transcripción: ${transcriptResponse.status}${errorData.error ? ` - ${errorData.error}` : ""}`,
      )
    }

    const transcriptResult = await transcriptResponse.json()
    const transcriptId = transcriptResult.id

    // Polling para obtener el resultado de la transcripción
    let transcriptData
    let status = "processing"

    while (status !== "completed" && status !== "error") {
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Esperar 1 segundo

      const checkResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: {
          Authorization: apiKey,
        },
      })

      if (!checkResponse.ok) {
        throw new Error(`Error al verificar el estado de la transcripción: ${checkResponse.status}`)
      }

      transcriptData = await checkResponse.json()
      status = transcriptData.status

      if (status === "error") {
        throw new Error(`Error en la transcripción: ${transcriptData.error}`)
      }
    }

    // Formatear los resultados para nuestra aplicación
    const formattedTranscription = []

    if (transcriptData.utterances) {
      transcriptData.utterances.forEach((utterance) => {
        const startTime = Math.floor(utterance.start / 1000) // Convertir a segundos
        const minutes = Math.floor(startTime / 60)
        const seconds = startTime % 60
        const timeFormatted = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`

        formattedTranscription.push({
          time: timeFormatted,
          speaker: `Speaker ${utterance.speaker}`,
          text: utterance.text,
        })
      })
    }

    return formattedTranscription
  } catch (error) {
    console.error("Error en la transcripción:", error)
    throw error
  }
}

// Componente principal
export default function NewMeetingPage() {
  const [recordingMode, setRecordingMode] = useState("record-audio")
  const [processingState, setProcessingState] = useState(null) // null, "processing", "transcribing", "analyzing", "completed"
  const [processingProgress, setProcessingProgress] = useState(0)
  const [showTranscription, setShowTranscription] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [savedSuccessfully, setSavedSuccessfully] = useState(false)
  const [audioUrl, setAudioUrl] = useState(null)
  const [driveUploadSuccess, setDriveUploadSuccess] = useState(false)
  const [audioFile, setAudioFile] = useState(null)
  const [error, setError] = useState(null)
  const [transcription, setTranscription] = useState([])
  const [analysisResults, setAnalysisResults] = useState({
    summary: "",
    keyPoints: [],
    tasks: [],
    metadata: {},
  })
  // Estado para las opciones avanzadas
  const [audioSettings, setAudioSettings] = useState({
    selectedMic: "default",
    availableMics: [],
    sensitivity: 75,
    quality: "medium",
    noiseReduction: "auto",
    language: "es", // Idioma por defecto: español
  })
  const [isSaving, setIsSaving] = useState(false)
  const [usageData, setUsageData] = useState(null)
  const [usageLoading, setUsageLoading] = useState(true)
  const isMobile = useMobile()
  const [driveFileInfo, setDriveFileInfo] = useState(null)
  const [isUploadingToDrive, setIsUploadingToDrive] = useState(false)
  // En la función uploadToGoogleDrive, añadir un estado para el progreso de carga
  const [uploadProgress, setUploadProgress] = useState(0)

  // Cambiar el modo si estamos en móvil y el modo seleccionado es "record-meeting"
  useEffect(() => {
    if (isMobile && recordingMode === "record-meeting") {
      setRecordingMode("record-audio")
    }
  }, [isMobile, recordingMode])

  // Estado para las características soportadas
  const [supportedFeatures, setSupportedFeatures] = useState({
    deviceSelection: false,
    sensitivity: false,
    quality: false,
    noiseReduction: false,
  })

  // Fetch usage data when component mounts
  useEffect(() => {
    const fetchUsageData = async () => {
      try {
        setUsageLoading(true)

        // Get username from localStorage
        const username = localStorage.getItem("juntify_username")

        if (!username) {
          console.error("No username found in localStorage")
          setUsageData({ used: 0, limit: 50, remaining: 50 })
          return
        }

        // Fetch usage data from API
        const response = await fetch("/api/user/usage", {
          headers: {
            "X-Username": username,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch usage data")
        }

        const data = await response.json()
        setUsageData(data)
      } catch (err) {
        console.error("Error fetching usage data:", err)
        // Set default values
        setUsageData({ used: 0, limit: 50, remaining: 50 })
      } finally {
        setUsageLoading(false)
      }
    }

    fetchUsageData()
  }, [])

  // Detectar dispositivos de audio disponibles
  useEffect(() => {
    const checkBrowserSupport = async () => {
      // Verificar si el navegador soporta getUserMedia
      const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)

      // Verificar si el navegador soporta AudioContext
      const hasAudioContext = !!(window.AudioContext || window.webkitAudioContext)

      // Verificar si el navegador soporta MediaRecorder
      const hasMediaRecorder = !!window.MediaRecorder

      // Actualizar las características soportadas
      setSupportedFeatures({
        deviceSelection: hasGetUserMedia,
        sensitivity: hasAudioContext,
        quality: hasMediaRecorder,
        noiseReduction: hasGetUserMedia,
      })

      if (hasGetUserMedia) {
        try {
          // Solicitar permisos para acceder al micrófono
          await navigator.mediaDevices.getUserMedia({ audio: true })

          // Obtener la lista de dispositivos
          const devices = await navigator.mediaDevices.enumerateDevices()
          const mics = devices
            .filter((device) => device.kind === "audioinput")
            .map((device) => ({
              deviceId: device.deviceId,
              label: device.label || `Micrófono ${device.deviceId.slice(0, 5)}`,
            }))

          // Añadir el micrófono predeterminado si no está en la lista
          if (!mics.some((mic) => mic.deviceId === "default")) {
            mics.unshift({ deviceId: "default", label: "Micrófono predeterminado" })
          }

          setAudioSettings((prev) => ({
            ...prev,
            availableMics: mics,
          }))
        } catch (err) {
          console.error("Error al acceder a los dispositivos de audio:", err)
          setError("No se pudo acceder a los dispositivos de audio. Por favor, verifica los permisos del micrófono.")
        }
      }
    }

    checkBrowserSupport()

    // Configurar un listener para detectar cambios en los dispositivos
    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      const handleDeviceChange = async () => {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices()
          const mics = devices
            .filter((device) => device.kind === "audioinput")
            .map((device) => ({
              deviceId: device.deviceId,
              label: device.label || `Micrófono ${device.deviceId.slice(0, 5)}`,
            }))

          if (!mics.some((mic) => mic.deviceId === "default")) {
            mics.unshift({ deviceId: "default", label: "Micrófono predeterminado" })
          }

          setAudioSettings((prev) => ({
            ...prev,
            availableMics: mics,
          }))
        } catch (err) {
          console.error("Error al actualizar los dispositivos de audio:", err)
        }
      }

      navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange)

      return () => {
        navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange)
      }
    }
  }, [])

  // Check if user has reached the monthly limit
  const hasReachedLimit = usageData && usageData.remaining <= 0

  // Manejar la finalización de la grabación o la selección de archivo
  const handleRecordingComplete = (audioData) => {
    console.log("Audio recibido:", audioData)

    if (!audioData || !audioData.blob) {
      setError("No se pudo obtener el audio grabado.")
      return
    }

    // Verificar que el blob tiene contenido
    if (audioData.blob.size === 0) {
      setError("El archivo de audio está vacío. Intenta grabar de nuevo.")
      return
    }

    setAudioFile(audioData)
    // Guardar la URL del audio para reproducirlo después
    setAudioUrl(audioData.url)
    console.log("Audio guardado correctamente, procediendo a procesar")

    // Iniciar el proceso de procesamiento
    processAudio(audioData.blob)
  }

  // Procesar el audio grabado o subido
  const processAudio = async (audioBlob) => {
    // Verificar que tenemos un blob de audio válido
    if (!audioBlob || audioBlob.size === 0) {
      setError("El archivo de audio está vacío o no es válido.")
      return
    }

    console.log("Procesando audio, tamaño:", audioBlob.size)
    setProcessingState("processing")
    setProcessingProgress(0)
    setError(null)

    try {
      // Guardar el audio en localStorage para respaldo
      const audioId = `processed_audio_${Date.now()}`
      localStorage.setItem("processingAudioId", audioId)

      // Simular procesamiento de audio
      const processingInterval = setInterval(() => {
        setProcessingProgress((prev) => {
          if (prev >= 100) {
            clearInterval(processingInterval)

            // Pasar a la transcripción
            setProcessingState("transcribing")
            setProcessingProgress(0)

            // Iniciar la transcripción real con Assembly AI
            startTranscription(audioBlob)

            return 100
          }
          return prev + 5
        })
      }, 200)
    } catch (err) {
      console.error("Error al procesar el audio:", err)
      setError(`Error al procesar el audio: ${err.message}`)
      resetProcess()
    }
  }

  // Iniciar la transcripción con Assembly AI
  const startTranscription = async (audioBlob) => {
    try {
      // Verificar que tenemos un blob válido
      if (!audioBlob || audioBlob.size === 0) {
        throw new Error("El archivo de audio está vacío o no es válido")
      }

      // Cambiar esta línea:
      // const assemblyApiKey = "b19443a8815e400984560f1a8f1e914f"
      // Por esta:
      const assemblyApiKey = "94bcf795057c4a8f833d69c5938da91a"

      // Simular progreso mientras se procesa
      const transcriptionInterval = setInterval(() => {
        setProcessingProgress((prev) => {
          if (prev >= 95) {
            clearInterval(transcriptionInterval)
            return 95
          }
          return prev + 5
        })
      }, 500)

      try {
        // Realizar la transcripción real
        const result = await transcribeAudio(audioBlob, assemblyApiKey, audioSettings)

        // Actualizar el estado con la transcripción
        setTranscription(result)

        // Completar el proceso
        clearInterval(transcriptionInterval)
        setProcessingProgress(100)
        setShowTranscription(true)
      } catch (err) {
        clearInterval(transcriptionInterval)
        console.error("Error en la transcripción:", err)
        setError(`Error en la transcripción: ${err.message}`)
        resetProcess()
      }
    } catch (err) {
      console.error("Error al iniciar la transcripción:", err)
      setError(`Error al iniciar la transcripción: ${err.message}`)
      resetProcess()
    }
  }

  // Manejar el análisis de la transcripción
  const handleAnalyze = async (editedTranscription, analyzerType = "standard") => {
    // Usar la transcripción editada si está disponible, de lo contrario usar la original
    const finalTranscription = editedTranscription || transcription
    setTranscription(finalTranscription) // Actualizar la transcripción con las ediciones

    setShowTranscription(false)
    setProcessingState("analyzing")
    setProcessingProgress(0)

    try {
      // Incrementar progreso gradualmente mientras esperamos la respuesta
      const analyzingInterval = setInterval(() => {
        setProcessingProgress((prev) => {
          if (prev >= 90) {
            return 90 // Mantener en 90% hasta que termine el análisis
          }
          return prev + 5
        })
      }, 500)

      // Preparar datos para el análisis
      const audioLength = audioFile?.duration || 0
      const durationFormatted = `${Math.floor(audioLength / 60)}:${audioLength % 60}`

      // Get username from localStorage
      const username = localStorage.getItem("juntify_username")

      if (!username) {
        throw new Error("No se encontró el nombre de usuario. Por favor, inicia sesión nuevamente.")
      }

      // Llamar al endpoint para analizar la transcripción
      const response = await fetch("/api/analyze-transcription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Username": username,
        },
        body: JSON.stringify({
          transcription: finalTranscription,
          analyzerType, // Añadir el tipo de analizador
          meetingData: {
            title: "Análisis temporal", // Título temporal
            duration: durationFormatted,
            audioUrl: audioFile?.url,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
      }

      const analysisResult = await response.json()

      // Limpiar el intervalo y completar el progreso
      clearInterval(analyzingInterval)
      setProcessingProgress(100)

      // Mostrar información de uso si está disponible
      if (analysisResult.usage) {
        console.log(`Análisis restantes este mes: ${analysisResult.usage.remaining} de ${analysisResult.usage.limit}`)
        // Update usage data
        setUsageData(analysisResult.usage)
      }

      // Actualizar el estado con los resultados del análisis
      setAnalysisResults({
        ...analysisResult,
        metadata: {
          analysisType: analyzerType,
        },
      })
      setProcessingState("completed")
      setShowAnalysis(true)
    } catch (err) {
      console.error("Error al analizar la transcripción:", err)
      setError(`Error al analizar la transcripción: ${err.message}`)
      setProcessingState(null)
      setProcessingProgress(0)
    }
  }

  // Reiniciar el proceso
  const resetProcess = () => {
    setProcessingState(null)
    setProcessingProgress(0)
    setShowTranscription(false)
    setShowAnalysis(false)
    setAudioFile(null)
    setTranscription([])
    setAnalysisResults({
      summary: "",
      keyPoints: [],
      tasks: [],
      metadata: {},
    })
    setError(null)
  }

  // Modificar la función uploadToGoogleDrive para incluir el progreso de carga simulado
  const uploadToGoogleDrive = async (audioBlob, fileName) => {
    try {
      setIsUploadingToDrive(true)
      setDriveUploadSuccess(false)
      setError(null)
      setUploadProgress(0)

      console.log("Iniciando subida a Google Drive. Tamaño del archivo:", audioBlob.size)

      // Verificar si el usuario está conectado a Google Drive
      const username = localStorage.getItem("juntify_username")
      if (!username) {
        throw new Error("No se encontró el nombre de usuario. Por favor, inicia sesión nuevamente.")
      }

      // Verificar el tamaño del archivo (máximo 100MB)
      const maxSize = 100 * 1024 * 1024 // 100MB en bytes
      if (audioBlob.size > maxSize) {
        throw new Error("El archivo es demasiado grande. El tamaño máximo permitido es 100MB.")
      }

      // Verificar la duración del audio (máximo 2 horas)
      if (audioFile && audioFile.duration > 7200) {
        // 2 horas = 7200 segundos
        throw new Error("El audio excede la duración máxima permitida de 2 horas.")
      }

      // Crear un FormData para enviar el archivo
      const formData = new FormData()

      // Asegurarse de que el blob tenga un tipo MIME válido
      const blobToUpload = audioBlob.type ? audioBlob : new Blob([audioBlob], { type: "audio/webm" })

      formData.append("audio", blobToUpload, fileName)

      console.log("Enviando solicitud a la API de Google Drive...")

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

      // Enviar el archivo a la API utilizando el endpoint existente
      const response = await fetch("/api/upload/google-drive", {
        method: "POST",
        headers: {
          "X-Username": username,
        },
        body: formData,
      })

      // Limpiar el intervalo y establecer el progreso al 100% cuando la respuesta está lista
      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
      }

      const fileInfo = await response.json()

      // Verificar que la respuesta contiene la información necesaria
      if (!fileInfo.fileId) {
        throw new Error("La respuesta no contiene la información necesaria del archivo")
      }

      // Añadir URL de descarga directa
      if (fileInfo.webContentLink) {
        fileInfo.downloadUrl = fileInfo.webContentLink
      }

      console.log("Archivo subido exitosamente:", fileInfo)
      setDriveFileInfo(fileInfo)
      setDriveUploadSuccess(true)
      return fileInfo
    } catch (error) {
      console.error("Error al subir a Google Drive:", error)
      setError(`Error al subir a Google Drive: ${error.message}`)
      throw error
    } finally {
      setIsUploadingToDrive(false)
    }
  }

  // Modificar la función handleSave para incluir la validación de tamaño y duración
  const handleSave = async (meetingData) => {
    setShowAnalysis(false)
    setIsSaving(true)
    setError(null)
    setDriveUploadSuccess(false)
    setUploadProgress(0)

    try {
      // Get username from localStorage
      const username = localStorage.getItem("juntify_username")

      if (!username) {
        throw new Error("No se encontró el nombre de usuario. Por favor, inicia sesión nuevamente.")
      }

      console.log("Guardando reunión con título:", meetingData.title)

      // Verificar el tamaño del archivo (máximo 100MB)
      if (audioFile && audioFile.blob && audioFile.blob.size > 100 * 1024 * 1024) {
        throw new Error("El archivo de audio es demasiado grande. El tamaño máximo permitido es 100MB.")
      }

      // Verificar la duración del audio (máximo 2 horas)
      if (audioFile && audioFile.duration > 7200) {
        // 2 horas = 7200 segundos
        throw new Error("El audio excede la duración máxima permitida de 2 horas.")
      }

      // Preparar solo los datos esenciales para evitar problemas
      // Formatear la duración correctamente
      const audioLength = audioFile?.duration || 0
      const durationFormatted = audioLength
        ? `${Math.floor(audioLength / 60)}:${(audioLength % 60).toString().padStart(2, "0")}`
        : null

      // Contar el número de hablantes únicos
      const uniqueSpeakers = new Set(transcription.map((item) => item.speaker)).size

      // Preparar los datos para guardar en la base de datos primero
      const meetingDataToSave = {
        title: meetingData.title || "Reunión sin título",
        date: new Date().toISOString(),
        summary: analysisResults.summary || null,
        duration: durationFormatted,
        participants: uniqueSpeakers || null,
        keyPoints: analysisResults.keyPoints || [],
        tasks: analysisResults.tasks || [],
        transcription: transcription.map((item) => ({
          time: item.time || "00:00",
          speaker: item.speaker || "Unknown",
          text: item.text || "",
        })),
      }

      console.log("Guardando datos de la reunión en la base de datos")

      // Llamar a la API para guardar la reunión en la base de datos primero
      const response = await fetch("/api/meetings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Username": username,
        },
        body: JSON.stringify(meetingDataToSave),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.details || `Error ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log("Reunión guardada con éxito:", result)

      // Obtener el ID de la reunión guardada
      const meetingId = result.meetingId || result.meeting?.id

      if (!meetingId) {
        throw new Error("No se pudo obtener el ID de la reunión guardada")
      }

      // Si hay archivo de audio, subirlo a Google Drive con el ID y título de la reunión
      let driveInfo = null
      if (audioFile && audioFile.blob) {
        try {
          setIsUploadingToDrive(true)
          setUploadProgress(0)

          // Generar un nombre de archivo basado en el ID y título de la reunión
          const safeTitle = meetingData.title.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 50) || "Reunion"
          const fileName = `${meetingId}_${safeTitle}.aac`

          console.log("Subiendo archivo a Google Drive con nombre:", fileName)

          // Crear un FormData para enviar el archivo
          const formData = new FormData()
          formData.append("meetingId", meetingId.toString())
          formData.append("fileName", fileName)

          // Asegurarse de que el blob tenga un tipo MIME válido
          const blobToUpload = audioFile.blob.type ? audioFile.blob : new Blob([audioFile.blob], { type: "audio/aac" })

          formData.append("audio", blobToUpload, fileName)

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

          // Enviar el archivo a la API
          const driveResponse = await fetch("/api/upload/meeting-audio", {
            method: "POST",
            headers: {
              "X-Username": username,
            },
            body: formData,
          })

          // Limpiar el intervalo y establecer el progreso al 100% cuando la respuesta está lista
          clearInterval(progressInterval)
          setUploadProgress(100)

          if (!driveResponse.ok) {
            const errorData = await driveResponse.json().catch(() => ({}))
            throw new Error(errorData.error || `Error ${driveResponse.status}: ${driveResponse.statusText}`)
          }

          driveInfo = await driveResponse.json()

          // Añadir URL de descarga directa si está disponible
          if (driveInfo.webContentLink) {
            driveInfo.downloadUrl = driveInfo.webContentLink
          }

          console.log("Archivo subido a Google Drive:", driveInfo)
          setDriveUploadSuccess(true)
        } catch (err) {
          console.error("Error al subir a Google Drive:", err)
          setError(`Error al subir a Google Drive: ${err.message}. La reunión se guardó pero sin el archivo de audio.`)
          // No interrumpir el proceso si falla la subida a Drive
        } finally {
          setIsUploadingToDrive(false)
        }
      }

      setSavedSuccessfully(true)

      // Simular redirección después de un tiempo
      setTimeout(() => {
        window.location.href = "/dashboard"
      }, 3000)
    } catch (err) {
      console.error("Error al guardar la reunión:", err)
      setError(`Error al guardar la reunión: ${err.message}`)
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-blue-900">
      {isSaving && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-900/80">
          <div className="flex flex-col items-center">
            <Loader className="h-12 w-12 text-blue-300 mb-4 animate-spin" />
            <span className="text-white text-lg font-semibold">Guardando reunión...</span>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 pb-24 pt-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8 glow-text">Crear una nueva reunión</h1>

          {error && (
            <Alert variant="destructive" className="mb-6 bg-red-900/50 border-red-800 text-white">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Usage indicator */}
          {!usageLoading && usageData && (
            <div className="mb-6">
              <div className="p-4 bg-blue-800/30 border border-blue-700/30 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-blue-200">Análisis mensuales</span>
                  <span className="text-sm font-medium text-blue-100">
                    {usageData.used}/{usageData.limit}
                  </span>
                </div>
                <Progress
                  value={(usageData.used / usageData.limit) * 100}
                  className="h-2 bg-blue-700/30"
                  indicatorClassName={usageData.remaining <= 0 ? "bg-red-500" : "bg-blue-500"}
                />
                <div className="mt-2 text-xs text-blue-300">
                  {usageData.remaining > 0
                    ? `${usageData.remaining} análisis restantes este mes`
                    : "Has alcanzado el límite de análisis para este mes"}
                </div>

                {hasReachedLimit && (
                  <Alert className="mt-4 bg-amber-900/50 border-amber-800 text-white">
                    <Lock className="h-4 w-4" />
                    <AlertTitle>Límite alcanzado</AlertTitle>
                    <AlertDescription>
                      Has alcanzado el límite de 50 transcripciones este mes. Vuelve el próximo mes para continuar.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          )}

          {/* Selección de idioma */}
          {!processingState && (
            <div className="mb-8 bg-blue-800/30 border border-blue-700/30 rounded-lg p-6">
              <h2 className="text-xl font-medium text-white mb-4">Configuración de transcripción</h2>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-blue-200">Idioma de la grabación</label>
                <Select
                  value={audioSettings.language}
                  onValueChange={(value) => setAudioSettings({ ...audioSettings, language: value })}
                  disabled={hasReachedLimit}
                >
                  <SelectTrigger
                    className={`bg-blue-700/40 border border-blue-600/50 text-white ${hasReachedLimit ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    <SelectValue placeholder="Seleccionar idioma" />
                  </SelectTrigger>
                  <SelectContent className="bg-blue-800/90 border border-blue-700/50 max-h-[300px]">
                    {supportedLanguages.map((language) => (
                      <SelectItem key={language.value} value={language.value} className="text-white">
                        {language.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="mt-4 p-3 bg-blue-700/30 rounded-lg border border-blue-600/30">
                  <h3 className="text-sm font-medium text-white mb-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2 text-blue-300" />
                    Detección automática de hablantes
                  </h3>
                  <p className="text-sm text-blue-300/70">
                    El sistema detectará automáticamente los diferentes hablantes en la conversación. Para mejores
                    resultados, asegúrate de que el audio sea claro y que haya diferencias notables entre las voces.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Modo de grabación */}
          {!processingState && (
            <>
              <div className="mb-8">
                <h2 className="text-xl font-medium text-white mb-4">Seleccionar modo de grabación</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    variant={recordingMode === "record-audio" ? "default" : "outline"}
                    className={`h-auto py-3 px-4 ${
                      recordingMode === "record-audio"
                        ? hasReachedLimit
                          ? "bg-gray-600 hover:bg-gray-700 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700"
                        : hasReachedLimit
                          ? "border-gray-600/50 text-gray-300 hover:bg-gray-800/30 cursor-not-allowed"
                          : "border-blue-600/50 text-blue-300 hover:bg-blue-800/30"
                    } text-white`}
                    onClick={() => !hasReachedLimit && setRecordingMode("record-audio")}
                    disabled={hasReachedLimit}
                  >
                    <Mic className="h-5 w-5 mr-2" />
                    <div className="text-left">
                      <div>Grabar audio</div>
                      <div className="text-xs opacity-70">Graba audio directamente desde tu dispositivo</div>
                    </div>
                  </Button>

                  <Button
                    variant={recordingMode === "upload-audio" ? "default" : "outline"}
                    className={`h-auto py-3 px-4 ${
                      recordingMode === "upload-audio"
                        ? hasReachedLimit
                          ? "bg-gray-600 hover:bg-gray-700 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700"
                        : hasReachedLimit
                          ? "border-gray-600/50 text-gray-300 hover:bg-gray-800/30 cursor-not-allowed"
                          : "border-blue-600/50 text-blue-300 hover:bg-blue-800/30"
                    } text-white`}
                    onClick={() => !hasReachedLimit && setRecordingMode("upload-audio")}
                    disabled={hasReachedLimit}
                  >
                    <Upload className="h-5 w-5 mr-2" />
                    <div className="text-left">
                      <div>Subir audio</div>
                      <div className="text-xs opacity-70">Sube un archivo de audio existente</div>
                    </div>
                  </Button>

                  {/* Ocultar la opción de grabar reunión en dispositivos móviles */}
                  {!isMobile && (
                    <Button
                      variant={recordingMode === "record-meeting" ? "default" : "outline"}
                      className={`h-auto py-3 px-4 ${
                        recordingMode === "record-meeting"
                          ? hasReachedLimit
                            ? "bg-gray-600 hover:bg-gray-700 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700"
                          : hasReachedLimit
                            ? "border-gray-600/50 text-gray-300 hover:bg-gray-800/30 cursor-not-allowed"
                            : "border-blue-600/50 text-blue-300 hover:bg-blue-800/30"
                      } text-white`}
                      onClick={() => !hasReachedLimit && setRecordingMode("record-meeting")}
                      disabled={hasReachedLimit}
                    >
                      <Video className="h-5 w-5 mr-2" />
                      <div className="text-left">
                        <div>Grabar reunión</div>
                        <div className="text-xs opacity-70">Graba reuniones desde plataformas externas</div>
                      </div>
                    </Button>
                  )}
                </div>
              </div>

              {/* Componente según el modo seleccionado */}
              <div className="mb-8">
                {recordingMode === "record-audio" && (
                  <LongAudioRecorder
                    onRecordingComplete={handleRecordingComplete}
                    disabled={hasReachedLimit}
                    maxDurationHours={2}
                  />
                )}

                {recordingMode === "upload-audio" && (
                  <AudioUploader onFileSelected={handleRecordingComplete} disabled={hasReachedLimit} />
                )}

                {recordingMode === "record-meeting" && (
                  <MeetingRecorder onRecordingComplete={handleRecordingComplete} disabled={hasReachedLimit} />
                )}
              </div>

              {/* Opciones avanzadas */}
              <div className="mb-8">
                <AdvancedOptions
                  settings={audioSettings}
                  onSettingsChange={setAudioSettings}
                  supportedFeatures={supportedFeatures}
                />
              </div>
            </>
          )}

          {/* Procesamiento */}
          {processingState && !showTranscription && !showAnalysis && (
            <div className="bg-blue-800/30 border border-blue-700/30 rounded-lg p-6">
              <h2 className="text-xl font-medium text-white mb-6">Procesando grabación</h2>
              <ProcessingSteps currentStep={processingState} progress={processingProgress} />
            </div>
          )}

          {/* Transcripción */}
          {showTranscription && (
            <div className="bg-blue-800/30 border border-blue-700/30 rounded-lg p-6">
              <h2 className="text-xl font-medium text-white mb-6">Transcripción generada</h2>

              {/* Reproductor de audio */}
              {audioUrl && (
                <div className="mb-6 bg-blue-800/40 p-4 rounded-lg border border-blue-700/50">
                  <h3 className="text-sm font-medium text-white mb-3 flex items-center">
                    <Play className="h-4 w-4 mr-2 text-blue-300" />
                    Reproducir grabación
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-3 items-center">
                    <audio controls className="w-full" src={audioUrl}>
                      Tu navegador no soporta el elemento de audio.
                    </audio>
                    {audioFile && audioFile.blob && (
                      <Button
                        variant="outline"
                        className="border-blue-600/50 text-blue-300 hover:bg-blue-800/30"
                        onClick={() => {
                          // Crear un enlace de descarga
                          const downloadUrl = URL.createObjectURL(audioFile.blob)
                          const a = document.createElement("a")
                          a.href = downloadUrl
                          a.download =
                            audioFile.name || `grabacion_${Date.now()}.${audioFile.blob.type.split("/")[1] || "aac"}`
                          document.body.appendChild(a)
                          a.click()
                          document.body.removeChild(a)
                          URL.revokeObjectURL(downloadUrl)
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <TranscriptionView transcription={transcription} onAnalyze={handleAnalyze} onCancel={resetProcess} />
            </div>
          )}

          {/* Análisis */}
          {showAnalysis && (
            <div className="bg-blue-800/30 border border-blue-700/30 rounded-lg p-6">
              <h2 className="text-xl font-medium text-white mb-6">Análisis de la reunión</h2>

              {/* Reproductor de audio */}
              {audioUrl && (
                <div className="mb-6 bg-blue-800/40 p-4 rounded-lg border border-blue-700/50">
                  <h3 className="text-sm font-medium text-white mb-3 flex items-center">
                    <Play className="h-4 w-4 mr-2 text-blue-300" />
                    Reproducir grabación
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-3 items-center">
                    <audio controls className="w-full" src={audioUrl}>
                      Tu navegador no soporta el elemento de audio.
                    </audio>
                    {audioFile && audioFile.blob && (
                      <Button
                        variant="outline"
                        className="border-blue-600/50 text-blue-300 hover:bg-blue-800/30"
                        onClick={() => {
                          // Crear un enlace de descarga
                          const downloadUrl = URL.createObjectURL(audioFile.blob)
                          const a = document.createElement("a")
                          a.href = downloadUrl
                          a.download =
                            audioFile.name || `grabacion_${Date.now()}.${audioFile.blob.type.split("/")[1] || "aac"}`
                          document.body.appendChild(a)
                          a.click()
                          document.body.removeChild(a)
                          URL.revokeObjectURL(downloadUrl)
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Mensaje de éxito de Drive */}
              {driveUploadSuccess && (
                <Alert className="mb-6 bg-green-900/50 border-green-800 text-white">
                  <Check className="h-4 w-4" />
                  <AlertTitle>Éxito</AlertTitle>
                  <AlertDescription>El audio se ha guardado correctamente en Google Drive.</AlertDescription>
                </Alert>
              )}

              {/* Modificar la parte del JSX para mostrar el progreso de carga en el indicador de carga de Drive */}
              {isUploadingToDrive && (
                <Alert className="mb-6 bg-blue-900/50 border-blue-800 text-white">
                  <div className="flex items-center w-full">
                    <Loader className="h-4 w-4 animate-spin mr-2" />
                    <div className="flex-1">
                      <AlertTitle>Subiendo</AlertTitle>
                      <AlertDescription>
                        <div className="mt-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Subiendo audio a Google Drive...</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <div className="w-full bg-blue-800/50 h-1.5 rounded-full">
                            <div
                              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300 ease-in-out"
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              )}

              <MeetingAnalysis
                analysis={analysisResults}
                onSave={handleSave}
                onCancel={resetProcess}
                driveFileInfo={driveFileInfo}
              />
            </div>
          )}
        </div>
      </main>

      {/* Diálogo de éxito */}
      <Dialog open={savedSuccessfully} onOpenChange={setSavedSuccessfully}>
        <DialogContent className="bg-blue-800/90 border border-blue-700/50 text-white">
          <DialogHeader>
            <DialogTitle>¡Reunión guardada con éxito!</DialogTitle>
            <DialogDescription className="text-blue-200">
              Tu reunión ha sido guardada correctamente. Serás redirigido al dashboard en unos segundos.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-4">
            <Check className="h-16 w-16 text-green-500" />
          </div>
        </DialogContent>
      </Dialog>

      {/* Navbar */}
      <NewNavbar />
    </div>
  )
}
