"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mic, MicOff, Pause, Play, Save, Trash2, Monitor, AlertCircle, CheckCircle, Square } from "lucide-react"
import { formatTime } from "@/utils/format-time"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

// Modificar la definición de props para añadir onRecordingComplete
export function MeetingRecorder({ onRecordingComplete }) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([])
  const [recordingError, setRecordingError] = useState<string | null>(null)
  const [micAudioLevel, setMicAudioLevel] = useState(0)
  const [systemAudioLevel, setSystemAudioLevel] = useState(0)
  const [recordingName, setRecordingName] = useState(`Reunión ${new Date().toLocaleDateString()}`)
  const [isSelectingSource, setIsSelectingSource] = useState(false)
  const [isSourceSelected, setIsSourceSelected] = useState(false)
  const [micEnabled, setMicEnabled] = useState(true)
  const [systemAudioEnabled, setSystemAudioEnabled] = useState(true)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Variables para segmentación
  const [segments, setSegments] = useState<Blob[]>([])
  const [currentSegmentNumber, setCurrentSegmentNumber] = useState(0)
  const [segmentDuration, setSegmentDuration] = useState(0)
  const [maxDuration] = useState(2 * 60 * 60) // 2 horas en segundos
  const [segmentSize, setSegmentSize] = useState(0)
  const [totalSize, setTotalSize] = useState(0)
  const [segmentationActive, setSegmentationActive] = useState(false)

  // Añadir estado para controlar la animación de los espectrogramas
  const [animationActive, setAnimationActive] = useState(false)
  const [showMicNotification, setShowMicNotification] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const combinedStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const micAnalyserRef = useRef<AnalyserNode | null>(null)
  const systemAnalyserRef = useRef<AnalyserNode | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioLevelTimerRef = useRef<NodeJS.Timeout | null>(null)
  // Referencias para los IDs de animación
  const micAnimationRef = useRef<number | null>(null)
  const systemAnimationRef = useRef<number | null>(null)

  const segmentTimerRef = useRef<NodeJS.Timeout | null>(null)
  const segmentDurationTimerRef = useRef<NodeJS.Timeout | null>(null)
  const segmentSizeCheckerRef = useRef<NodeJS.Timeout | null>(null)
  const MAX_SEGMENT_DURATION = 10 * 60 * 1000 // 10 minutos por segmento

  // Detectar si estamos en un entorno que no permite getDisplayMedia
  useEffect(() => {
    const checkEnvironment = async () => {
      try {
        // Verificar si getDisplayMedia está disponible sin intentar acceder a él
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
          setIsPreviewMode(true)
          return
        }

        // Solo verificamos si existe la API, pero no la llamamos automáticamente
        setIsPreviewMode(false)
      } catch (err) {
        setIsPreviewMode(true)
      }
    }

    checkEnvironment()
  }, [])

  // Función para limpiar los canvas de espectrogramas
  const clearSpectrograms = () => {
    // Cancelar las animaciones en curso
    if (micAnimationRef.current) {
      cancelAnimationFrame(micAnimationRef.current)
      micAnimationRef.current = null
    }

    if (systemAnimationRef.current) {
      cancelAnimationFrame(systemAnimationRef.current)
      systemAnimationRef.current = null
    }

    // Limpiar los canvas
    const systemCanvas = document.querySelector('canvas[data-spectrum="system"]') as HTMLCanvasElement
    const micCanvas = document.querySelector('canvas[data-spectrum="mic"]') as HTMLCanvasElement

    if (systemCanvas) {
      const ctx = systemCanvas.getContext("2d")
      if (ctx) {
        ctx.fillStyle = "rgb(20, 30, 60)"
        ctx.fillRect(0, 0, systemCanvas.width, systemCanvas.height)
      }
    }

    if (micCanvas) {
      const ctx = micCanvas.getContext("2d")
      if (ctx) {
        ctx.fillStyle = "rgb(20, 30, 60)"
        ctx.fillRect(0, 0, micCanvas.width, micCanvas.height)
      }
    }

    // Resetear los niveles de audio
    setMicAudioLevel(0)
    setSystemAudioLevel(0)
  }

  // Cleanup function for all streams and recorder
  const cleanupResources = () => {
    // Desactivar las animaciones
    setAnimationActive(false)

    // Limpiar los espectrogramas
    clearSpectrograms()

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (audioLevelTimerRef.current) {
      clearInterval(audioLevelTimerRef.current)
      audioLevelTimerRef.current = null
    }

    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop()
      }
      mediaRecorderRef.current = null
    }
    // Stop all tracks in all streams
    ;[screenStreamRef, micStreamRef, combinedStreamRef].forEach((streamRef) => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop()
        })
        streamRef.current = null
      }
    })

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error)
      audioContextRef.current = null
      micAnalyserRef.current = null
      systemAnalyserRef.current = null
    }

    setIsSourceSelected(false)
  }

  // Cleanup on component unmount
  useEffect(() => {
    return cleanupResources
  }, [])

  // Función para seleccionar la fuente de audio del sistema
  const selectAudioSource = async () => {
    try {
      setRecordingError(null)
      setIsSelectingSource(true)

      if (isPreviewMode) {
        setRecordingError("La captura de audio del sistema no está disponible en este entorno de vista previa.")
        setIsSelectingSource(false)
        return
      }

      // Ahora solicitamos explícitamente el stream de pantalla con audio
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true, // Necesitamos solicitar video para que muestre el selector
          audio: true, // Solicitar audio del sistema
        })

        // Verificar si tenemos pistas de audio
        const hasSystemAudio = screenStream.getAudioTracks().length > 0

        if (!hasSystemAudio) {
          // Mostrar advertencia pero continuar
          console.warn("No se detectó audio del sistema en la fuente seleccionada.")
        }

        // Guardar el stream
        screenStreamRef.current = screenStream

        // Detener las pistas de video, solo necesitamos el audio
        screenStream.getVideoTracks().forEach((track) => {
          track.enabled = false // Desactivar en lugar de detener para mantener la conexión
        })

        // Configurar el análisis de audio
        setupAudioAnalysis()

        setIsSourceSelected(true)
        setIsSelectingSource(false)
        setAnimationActive(true)

        // Manejar cuando el usuario detiene la compartición desde el navegador
        screenStream.addEventListener("inactive", () => {
          cleanupResources()
        })
      } catch (err) {
        console.error("Error al seleccionar fuente de audio:", err)
        setRecordingError("No se pudo seleccionar la fuente de audio. Verifica los permisos del navegador.")
        setIsSelectingSource(false)
      }
    } catch (error) {
      console.error("Error al seleccionar fuente de audio:", error)
      setRecordingError("No se pudo seleccionar la fuente de audio. Verifica los permisos del navegador.")
      setIsSelectingSource(false)
    }
  }

  // Configurar análisis de audio para visualización
  const setupAudioAnalysis = async () => {
    try {
      // Crear contexto de audio si no existe
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext()
      }

      const audioContext = audioContextRef.current

      // Configurar analizador para audio del sistema
      if (screenStreamRef.current && screenStreamRef.current.getAudioTracks().length > 0) {
        const systemAnalyser = audioContext.createAnalyser()
        systemAnalyser.fftSize = 256
        systemAnalyserRef.current = systemAnalyser

        const systemSource = audioContext.createMediaStreamSource(screenStreamRef.current)
        systemSource.connect(systemAnalyser)

        // Iniciar la animación del espectrograma del sistema
        setAnimationActive(true)
      }

      // Obtener acceso al micrófono si está habilitado
      if (micEnabled && !micStreamRef.current) {
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          })
          micStreamRef.current = micStream

          // Configurar analizador para micrófono
          const micAnalyser = audioContext.createAnalyser()
          micAnalyser.fftSize = 256
          micAnalyserRef.current = micAnalyser

          const micSource = audioContext.createMediaStreamSource(micStream)
          micSource.connect(micAnalyser)

          // Iniciar la animación del espectrograma del micrófono
          setAnimationActive(true)
        } catch (micError) {
          console.error("Error al acceder al micrófono:", micError)
          setMicEnabled(false)
        }
      }
    } catch (error) {
      console.error("Error al configurar análisis de audio:", error)
    }
  }

  // Iniciar grabación de audio
  const startRecording = async () => {
    try {
      setRecordingError(null)

      // Si estamos en modo de vista previa, mostrar mensaje
      if (isPreviewMode) {
        setRecordingError("La grabación de audio del sistema no está disponible en este entorno de vista previa.")
        return
      }

      // Verificar si tenemos una fuente de audio seleccionada
      if (!isSourceSelected && !screenStreamRef.current) {
        setRecordingError("Primero debes seleccionar una fuente de audio.")
        return
      }

      // Asegurarse de que el micrófono esté activado
      if (!micEnabled) {
        setMicEnabled(true)
        // Mostrar notificación sobre el micrófono
        setShowMicNotification(true)
        // Ocultar la notificación después de 5 segundos
        setTimeout(() => {
          setShowMicNotification(false)
        }, 5000)
      }

      // Crear contexto de audio para mezclar las fuentes
      const audioContext = new AudioContext()
      const destination = audioContext.createMediaStreamDestination()

      let hasAudioSources = false

      // Añadir audio del sistema si está disponible y habilitado
      if (systemAudioEnabled && screenStreamRef.current && screenStreamRef.current.getAudioTracks().length > 0) {
        const systemSource = audioContext.createMediaStreamSource(screenStreamRef.current)
        systemSource.connect(destination)
        hasAudioSources = true
        console.log("Audio del sistema conectado a la mezcla")
      }

      // Añadir audio del micrófono (siempre habilitado al iniciar grabación)
      // Si no tenemos acceso al micrófono, solicitarlo
      if (!micStreamRef.current || micStreamRef.current.getAudioTracks().length === 0) {
        try {
          console.log("Solicitando acceso al micrófono...")
          const micStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          })

          console.log("Micrófono conectado:", micStream.getAudioTracks().length, "pistas")
          micStreamRef.current = micStream

          // Asegurarse de que todas las pistas estén habilitadas
          micStream.getAudioTracks().forEach((track) => {
            track.enabled = true
            console.log(`Pista de micrófono: ${track.label}, habilitada: ${track.enabled}`)
          })

          // Actualizar análisis de audio
          if (audioContextRef.current) {
            const micAnalyser = audioContextRef.current.createAnalyser()
            micAnalyser.fftSize = 256
            micAnalyserRef.current = micAnalyser

            const micSource = audioContextRef.current.createMediaStreamSource(micStream)
            micSource.connect(micAnalyser)

            // Activar la animación del espectrograma
            setAnimationActive(true)
          }
        } catch (micError) {
          console.error("Error al acceder al micrófono:", micError)
          setRecordingError("No se pudo acceder al micrófono. Verifica los permisos del navegador.")
          return
        }
      }

      if (micStreamRef.current && micStreamRef.current.getAudioTracks().length > 0) {
        // Asegurarse de que las pistas de audio del micrófono estén habilitadas
        micStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = true
          console.log(`Conectando pista de micrófono a la mezcla: ${track.label}, habilitada: ${track.enabled}`)
        })

        const micSource = audioContext.createMediaStreamSource(micStreamRef.current)
        micSource.connect(destination)
        hasAudioSources = true
        console.log("Audio del micrófono conectado a la mezcla")
      } else {
        console.warn("No se encontraron pistas de audio en el micrófono")
      }

      // Verificar si tenemos fuentes de audio para grabar
      if (!hasAudioSources) {
        setRecordingError("No se detectaron fuentes de audio para grabar. Verifica la configuración.")
        return
      }

      // Usar el stream combinado del destino de audio
      const combinedStream = destination.stream
      combinedStreamRef.current = combinedStream

      console.log(`Pistas de audio combinadas: ${combinedStream.getAudioTracks().length}`)
      combinedStream.getAudioTracks().forEach((track, i) => {
        console.log(`Pista ${i}: ${track.label}, habilitada: ${track.enabled}`)
      })

      // Iniciar un nuevo segmento
      startNewSegment(combinedStream)

      // Iniciar temporizador para la duración total
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          // Verificar si hemos alcanzado la duración máxima
          if (prev + 1 >= maxDuration) {
            stopRecording()
            return prev
          }
          return prev + 1
        })
      }, 1000)

      // Iniciar temporizador para la duración del segmento
      segmentDurationTimerRef.current = setInterval(() => {
        setSegmentDuration((prev) => prev + 1)
      }, 1000)

      // Iniciar verificador de tamaño del segmento
      segmentSizeCheckerRef.current = setInterval(() => {
        if (recordedChunks.length > 0) {
          const currentSize = recordedChunks.reduce((total, chunk) => total + chunk.size, 0) / (1024 * 1024)
          setSegmentSize(currentSize)
        }
      }, 5000)

      setIsRecording(true)
      setIsPaused(false)
      setSegmentationActive(true)
      setRecordedChunks([])
      setSegments([])
      setCurrentSegmentNumber(1)
      setSegmentDuration(0)
      setTotalSize(0)
    } catch (error) {
      console.error("Error al iniciar grabación:", error)
      setRecordingError(`Error al iniciar la grabación: ${error instanceof Error ? error.message : "Desconocido"}`)
    }
  }

  const startNewSegment = (stream: MediaStream) => {
    // Crear y configurar MediaRecorder con opciones de fallback
    let options
    try {
      options = { mimeType: "audio/webm" }
      mediaRecorderRef.current = new MediaRecorder(stream, options)
    } catch (e) {
      console.warn("El formato audio/webm no es compatible, intentando con formato alternativo", e)
      try {
        options = { mimeType: "audio/ogg" }
        mediaRecorderRef.current = new MediaRecorder(stream, options)
      } catch (e2) {
        console.error("No se pudo crear MediaRecorder con ningún formato compatible", e2)
        mediaRecorderRef.current = new MediaRecorder(stream)
      }
    }

    // Configurar eventos
    mediaRecorderRef.current.ondataavailable = handleDataAvailable
    mediaRecorderRef.current.onstop = handleSegmentComplete

    // Iniciar grabación
    mediaRecorderRef.current.start(1000) // Recopilar datos cada segundo
    // Asegurar que la animación del espectrograma siga activa
    setAnimationActive(true)

    // Programar el cambio de segmento
    segmentTimerRef.current = setTimeout(() => {
      if (isRecording && !isPaused && mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        // Detener el segmento actual
        mediaRecorderRef.current.stop()
      }
    }, MAX_SEGMENT_DURATION)
  }

  const handleDataAvailable = (event: BlobEvent) => {
    if (event.data && event.data.size > 0) {
      setRecordedChunks((prev) => [...prev, event.data])
    }
  }

  const handleSegmentComplete = () => {
    if (recordedChunks.length > 0) {
      // Crear un blob con los chunks del segmento actual
      const segmentBlob = new Blob(recordedChunks, { type: mediaRecorderRef.current?.mimeType || "audio/webm" })

      // Añadir el segmento a la lista de segmentos
      setSegments((prevSegments) => [...prevSegments, segmentBlob])

      // Actualizar el tamaño total
      setTotalSize((prevSize) => prevSize + segmentBlob.size / (1024 * 1024))

      // Incrementar el contador de segmentos
      setCurrentSegmentNumber((prev) => prev + 1)

      // Reiniciar la duración del segmento
      setSegmentDuration(0)

      // Limpiar los chunks para el próximo segmento
      setRecordedChunks([])

      // Si todavía estamos grabando, iniciar un nuevo segmento
      if (isRecording && !isPaused && combinedStreamRef.current) {
        startNewSegment(combinedStreamRef.current)
      }
    }
    // Mantener la animación activa durante la segmentación
    if (isRecording && !isPaused) {
      setAnimationActive(true)
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause()
      setIsPaused(true)

      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume()
      setIsPaused(false)

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }

    // Limpiar temporizadores
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (segmentTimerRef.current) {
      clearTimeout(segmentTimerRef.current)
      segmentTimerRef.current = null
    }

    if (segmentDurationTimerRef.current) {
      clearInterval(segmentDurationTimerRef.current)
      segmentDurationTimerRef.current = null
    }

    if (segmentSizeCheckerRef.current) {
      clearInterval(segmentSizeCheckerRef.current)
      segmentSizeCheckerRef.current = null
    }

    setSegmentationActive(false)

    // Actualizar el estado de grabación
    setIsRecording(false)
    setIsPaused(false)
  }

  const handleRecordingStopped = () => {
    setIsRecording(false)
    setIsPaused(false)
  }

  // Modificar la función saveRecording para enviar la grabación al flujo de procesamiento
  const saveRecording = () => {
    // Combinar todos los segmentos con el segmento actual (si existe)
    const allSegments = [...segments]

    // Si hay chunks en el segmento actual, añadirlos también
    if (recordedChunks.length > 0) {
      const currentSegmentBlob = new Blob(recordedChunks, { type: mediaRecorderRef.current?.mimeType || "audio/webm" })
      allSegments.push(currentSegmentBlob)
    }

    if (allSegments.length === 0) {
      setRecordingError("No hay grabación para guardar.")
      return
    }

    // Crear un blob combinado con todos los segmentos
    const mimeType = mediaRecorderRef.current?.mimeType || "audio/webm"
    const finalBlob = new Blob(allSegments, { type: mimeType })
    const url = URL.createObjectURL(finalBlob)

    // Descargar el archivo
    const a = document.createElement("a")
    a.style.display = "none"
    a.href = url
    a.download = `${recordingName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.webm`
    document.body.appendChild(a)
    a.click()

    // Limpiar
    setTimeout(() => {
      document.body.removeChild(a)
    }, 100)

    // Mostrar mensaje de confirmación
    setRecordingError(null)
    setSaveSuccess(true)

    // Enviar la grabación al flujo de procesamiento si la función está disponible
    if (typeof onRecordingComplete === "function") {
      onRecordingComplete({
        id: `audio_${Date.now()}`,
        url: url,
        blob: finalBlob,
        duration: recordingTime,
        name: `${recordingName}.webm`,
      })
    }

    // Limpiar URL después de un tiempo
    setTimeout(() => {
      URL.revokeObjectURL(url)
      setSaveSuccess(false)
    }, 3000)
  }

  const discardRecording = () => {
    setRecordedChunks([])
    setSegments([])
    setRecordingTime(0)
    setSegmentDuration(0)
    setCurrentSegmentNumber(0)
    setTotalSize(0)
    setSegmentSize(0)

    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop()
      }
      mediaRecorderRef.current = null
    }

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (segmentTimerRef.current) {
      clearTimeout(segmentTimerRef.current)
      segmentTimerRef.current = null
    }

    if (segmentDurationTimerRef.current) {
      clearInterval(segmentDurationTimerRef.current)
      segmentDurationTimerRef.current = null
    }

    if (segmentSizeCheckerRef.current) {
      clearInterval(segmentSizeCheckerRef.current)
      segmentSizeCheckerRef.current = null
    }
  }

  // Función para finalizar completamente la sesión
  const endSession = () => {
    // Primero cancelamos las animaciones
    if (micAnimationRef.current) {
      cancelAnimationFrame(micAnimationRef.current)
      micAnimationRef.current = null
    }

    if (systemAnimationRef.current) {
      cancelAnimationFrame(systemAnimationRef.current)
      systemAnimationRef.current = null
    }

    // Desactivar explícitamente las animaciones
    setAnimationActive(false)

    // Limpiar inmediatamente los canvas
    const systemCanvas = document.querySelector('canvas[data-spectrum="system"]') as HTMLCanvasElement
    const micCanvas = document.querySelector('canvas[data-spectrum="mic"]') as HTMLCanvasElement

    if (systemCanvas) {
      const ctx = systemCanvas.getContext("2d")
      if (ctx) {
        ctx.clearRect(0, 0, systemCanvas.width, systemCanvas.height)
        ctx.fillStyle = "rgb(20, 30, 60)"
        ctx.fillRect(0, 0, systemCanvas.width, systemCanvas.height)
      }
    }

    if (micCanvas) {
      const ctx = micCanvas.getContext("2d")
      if (ctx) {
        ctx.clearRect(0, 0, micCanvas.width, micCanvas.height)
        ctx.fillStyle = "rgb(20, 30, 60)"
        ctx.fillRect(0, 0, micCanvas.width, micCanvas.height)
      }
    }

    // Resetear los niveles de audio
    setMicAudioLevel(0)
    setSystemAudioLevel(0)

    // Detener y limpiar todos los streams
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop())
      screenStreamRef.current = null
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop())
      micStreamRef.current = null
    }

    if (combinedStreamRef.current) {
      combinedStreamRef.current.getTracks().forEach((track) => track.stop())
      combinedStreamRef.current = null
    }

    // Cerrar el contexto de audio
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error)
      audioContextRef.current = null
      micAnalyserRef.current = null
      systemAnalyserRef.current = null
    }

    // Limpiar temporizadores
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (audioLevelTimerRef.current) {
      clearInterval(audioLevelTimerRef.current)
      audioLevelTimerRef.current = null
    }

    if (segmentTimerRef.current) {
      clearTimeout(segmentTimerRef.current)
      segmentTimerRef.current = null
    }

    if (segmentDurationTimerRef.current) {
      clearInterval(segmentDurationTimerRef.current)
      segmentDurationTimerRef.current = null
    }

    if (segmentSizeCheckerRef.current) {
      clearInterval(segmentSizeCheckerRef.current)
      segmentSizeCheckerRef.current = null
    }

    // Resetear estados
    setRecordedChunks([])
    setSegments([])
    setRecordingTime(0)
    setSegmentDuration(0)
    setCurrentSegmentNumber(0)
    setTotalSize(0)
    setSegmentSize(0)
    setIsSourceSelected(false)
    setMicEnabled(true)
    setSystemAudioEnabled(true)
    setSegmentationActive(false)
  }

  // Función para alternar el micrófono
  const toggleMicrophone = () => {
    const newMicEnabled = !micEnabled
    setMicEnabled(newMicEnabled)

    // Si tenemos un stream de micrófono, actualizar el estado de las pistas
    if (micStreamRef.current) {
      micStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = newMicEnabled
      })
    }

    // Si estamos grabando, también necesitamos actualizar las pistas en el stream combinado
    if (isRecording && combinedStreamRef.current) {
      // Intentar encontrar y actualizar las pistas de micrófono en el stream combinado
      const audioTracks = combinedStreamRef.current.getAudioTracks()
      if (audioTracks.length > 0) {
        // Si hay múltiples pistas, la del micrófono podría ser identificable por su etiqueta
        audioTracks.forEach((track) => {
          if (track.label && track.label.toLowerCase().includes("mic")) {
            track.enabled = newMicEnabled
          }
        })
      }
    }
  }

  // Función para alternar el audio del sistema
  const toggleSystemAudio = () => {
    setSystemAudioEnabled(!systemAudioEnabled)

    // Si tenemos un stream de sistema, actualizar el estado de las pistas de audio
    if (screenStreamRef.current) {
      screenStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !systemAudioEnabled
      })
    }
  }

  // Función para inicializar los canvas con un fondo vacío
  const initializeCanvas = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.fillStyle = "rgb(20, 30, 60)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Asegurarse de que el canvas tenga el tamaño correcto
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth
        canvas.height = canvas.clientHeight
      }
    }
  }

  // Añadir una función específica para limpiar los canvas y asegurarse de que se llame en los momentos críticos

  // Añade esta función después de la función initializeCanvas:

  const forceCleanCanvas = () => {
    // Obtener referencias a los canvas
    const systemCanvas = document.querySelector('canvas[data-spectrum="system"]') as HTMLCanvasElement
    const micCanvas = document.querySelector('canvas[data-spectrum="mic"]') as HTMLCanvasElement

    // Limpiar el canvas del sistema
    if (systemCanvas) {
      const ctx = systemCanvas.getContext("2d")
      if (ctx) {
        ctx.clearRect(0, 0, systemCanvas.width, systemCanvas.height)
        ctx.fillStyle = "rgb(20, 30, 60)"
        ctx.fillRect(0, 0, systemCanvas.width, systemCanvas.height)
      }
    }

    // Limpiar el canvas del micrófono
    if (micCanvas) {
      const ctx = micCanvas.getContext("2d")
      if (ctx) {
        ctx.clearRect(0, 0, micCanvas.width, micCanvas.height)
        ctx.fillStyle = "rgb(20, 30, 60)"
        ctx.fillRect(0, 0, micCanvas.width, micCanvas.height)
      }
    }
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Grabador de audio de reuniones</span>
            {isRecording && (
              <Badge variant={isPaused ? "outline" : "destructive"} className="animate-pulse">
                {isPaused ? "Pausado" : "Grabando"}
              </Badge>
            )}
            {isSourceSelected && !isRecording && <Badge variant="secondary">Fuente seleccionada</Badge>}
          </CardTitle>
          <CardDescription>
            Captura el audio de una reunión o llamada, combinando el audio del sistema y tu micrófono
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isPreviewMode && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Limitaciones en el entorno de vista previa</AlertTitle>
              <AlertDescription>
                La captura de audio del sistema no está disponible en este entorno debido a restricciones de seguridad.
                Esta funcionalidad estará disponible cuando la aplicación se ejecute en un entorno de producción.
              </AlertDescription>
            </Alert>
          )}

          {recordingError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{recordingError}</AlertDescription>
            </Alert>
          )}

          {saveSuccess && (
            <Alert className="mb-4">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Grabación guardada con éxito</AlertTitle>
              <AlertDescription>
                La grabación se ha guardado correctamente y se está procesando para transcripción.
              </AlertDescription>
            </Alert>
          )}

          {showMicNotification && (
            <Alert className="mb-4">
              <Mic className="h-4 w-4" />
              <AlertTitle>Micrófono activado</AlertTitle>
              <AlertDescription>
                El micrófono ha sido activado automáticamente para la grabación. Asegúrate de permitir el acceso al
                micrófono en tu navegador para una correcta captura de audio.
              </AlertDescription>
            </Alert>
          )}

          {/* Controles de fuentes de audio */}
          <div className="flex justify-center gap-4 mb-6">
            <Button
              variant={systemAudioEnabled ? "default" : "outline"}
              className={`h-auto py-3 px-6 ${
                systemAudioEnabled
                  ? "bg-blue-600/30 border border-blue-600/50 text-blue-300 hover:bg-blue-700/30"
                  : "border-blue-600/50 text-blue-300 hover:bg-blue-800/30"
              }`}
              onClick={toggleSystemAudio}
              disabled={!isSourceSelected || isRecording}
            >
              <Monitor className="h-5 w-5 mr-2" />
              Sistema {systemAudioEnabled ? "activado" : "desactivado"}
            </Button>

            <Button
              variant={micEnabled ? "default" : "outline"}
              className={`h-auto py-3 px-6 ${
                micEnabled
                  ? "bg-blue-600/30 border border-blue-600/50 text-blue-300 hover:bg-blue-700/30"
                  : "border-blue-600/50 text-blue-300 hover:bg-blue-800/30"
              }`}
              onClick={toggleMicrophone}
            >
              {micEnabled ? <Mic className="h-5 w-5 mr-2" /> : <MicOff className="h-5 w-5 mr-2" />}
              Micrófono {micEnabled ? "activado" : "desactivado"}
            </Button>
          </div>

          {/* Visualizador de espectrograma de audio del sistema */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Monitor className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Audio del sistema</span>
              </div>
            </div>
            <canvas
              data-spectrum="system"
              ref={(canvas) => {
                if (canvas) {
                  // Asegurar que el canvas tenga el tamaño correcto
                  if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
                    canvas.width = canvas.clientWidth
                    canvas.height = canvas.clientHeight
                  }

                  // Inicializar el canvas con un fondo vacío
                  initializeCanvas(canvas)

                  const canvasRef = canvas
                  const canvasCtx = canvasRef.getContext("2d")

                  if (canvasCtx && systemAnalyserRef.current && animationActive) {
                    const WIDTH = canvasRef.width
                    const HEIGHT = canvasRef.height
                    const analyser = systemAnalyserRef.current
                    const bufferLength = analyser.frequencyBinCount
                    const dataArray = new Uint8Array(bufferLength)

                    const drawSystemSpectrum = () => {
                      // Verificar si la animación está activa y si tenemos un analizador
                      if (!animationActive || !systemAnalyserRef.current) {
                        // Limpiar el canvas una última vez
                        canvasCtx.fillStyle = "rgb(20, 30, 60)"
                        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT)
                        setSystemAudioLevel(0)
                        return
                      }

                      systemAnimationRef.current = requestAnimationFrame(drawSystemSpectrum)

                      try {
                        analyser.getByteFrequencyData(dataArray)

                        canvasCtx.fillStyle = "rgb(20, 30, 60)"
                        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT)

                        const barWidth = (WIDTH / bufferLength) * 2.5
                        let x = 0

                        for (let i = 0; i < bufferLength; i++) {
                          const barHeight = dataArray[i] / 2

                          // Gradiente de color basado en la intensidad
                          const hue = 220 - (dataArray[i] / 255) * 60 // Azul a celeste
                          canvasCtx.fillStyle = `hsla(${hue}, 100%, 60%, 0.8)`

                          canvasCtx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight)
                          x += barWidth + 1
                        }

                        // Calcular nivel de audio para otras funciones
                        let sum = 0
                        for (let i = 0; i < bufferLength; i++) {
                          sum += dataArray[i]
                        }
                        const average = sum / bufferLength
                        setSystemAudioLevel((average / 255) * 100)
                      } catch (error) {
                        console.error("Error al dibujar espectrograma del sistema:", error)
                        cancelAnimationFrame(systemAnimationRef.current)
                        systemAnimationRef.current = null
                      }
                    }

                    // Iniciar la animación
                    drawSystemSpectrum()
                  }
                }
              }}
              width="600"
              height="60"
              className="w-full h-15 rounded-lg bg-blue-900/50"
            />
          </div>

          {/* Visualizador de espectrograma de audio del micrófono */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Mic className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Audio del micrófono</span>
              </div>
            </div>
            <canvas
              data-spectrum="mic"
              ref={(canvas) => {
                if (canvas) {
                  // Asegurar que el canvas tenga el tamaño correcto
                  if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
                    canvas.width = canvas.clientWidth
                    canvas.height = canvas.clientHeight
                  }

                  // Inicializar el canvas con un fondo vacío
                  initializeCanvas(canvas)

                  const canvasRef = canvas
                  const canvasCtx = canvasRef.getContext("2d")

                  if (canvasCtx && micAnalyserRef.current && animationActive) {
                    const WIDTH = canvasRef.width
                    const HEIGHT = canvasRef.height
                    const analyser = micAnalyserRef.current
                    const bufferLength = analyser.frequencyBinCount
                    const dataArray = new Uint8Array(bufferLength)

                    const drawMicSpectrum = () => {
                      // Verificar si la animación está activa y si tenemos un analizador
                      if (!animationActive || !micAnalyserRef.current) {
                        // Limpiar el canvas una última vez
                        canvasCtx.fillStyle = "rgb(20, 30, 60)"
                        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT)
                        setMicAudioLevel(0)
                        return
                      }

                      micAnimationRef.current = requestAnimationFrame(drawMicSpectrum)

                      try {
                        analyser.getByteFrequencyData(dataArray)

                        canvasCtx.fillStyle = "rgb(20, 30, 60)"
                        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT)

                        const barWidth = (WIDTH / bufferLength) * 2.5
                        let x = 0

                        for (let i = 0; i < bufferLength; i++) {
                          const barHeight = dataArray[i] / 2

                          // Gradiente de color basado en la intensidad
                          const hue = 220 - (dataArray[i] / 255) * 60 // Azul a celeste
                          canvasCtx.fillStyle = `hsla(${hue}, 100%, 60%, 0.8)`

                          canvasCtx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight)
                          x += barWidth + 1
                        }

                        // Calcular nivel de audio para otras funciones
                        let sum = 0
                        for (let i = 0; i < bufferLength; i++) {
                          sum += dataArray[i]
                        }
                        const average = sum / bufferLength
                        setMicAudioLevel((average / 255) * 100)
                      } catch (error) {
                        console.error("Error al dibujar espectrograma del micrófono:", error)
                        cancelAnimationFrame(micAnimationRef.current)
                        micAnimationRef.current = null
                      }
                    }

                    // Iniciar la animación
                    drawMicSpectrum()
                  }
                }
              }}
              width="600"
              height="60"
              className="w-full h-15 rounded-lg bg-blue-900/50"
            />
          </div>

          <div className="flex flex-col items-center space-y-4">
            <div className="text-4xl font-mono">{formatTime(recordingTime)}</div>
            <div className="text-blue-300/70 text-sm">
              {isRecording ? (isPaused ? "Grabación pausada" : "Grabando...") : "Listo para grabar"}
            </div>
          </div>

          {/* Información de segmentación */}
          {segmentationActive && (
            <div className="mt-4 p-3 bg-blue-900/20 rounded-lg border border-blue-800/30">
              <h4 className="text-sm font-medium mb-2 text-blue-300">Información de segmentación</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-blue-400">Segmento actual:</span> {currentSegmentNumber}
                </div>
                <div>
                  <span className="text-blue-400">Duración del segmento:</span> {formatTime(segmentDuration)}
                </div>
                <div>
                  <span className="text-blue-400">Tamaño del segmento:</span> {segmentSize.toFixed(2)} MB
                </div>
                <div>
                  <span className="text-blue-400">Tamaño total:</span> {totalSize.toFixed(2)} MB
                </div>
              </div>
              <div className="mt-2">
                <div className="text-xs text-blue-400 mb-1">Progreso del segmento:</div>
                <div className="w-full bg-blue-900/30 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${Math.min((segmentDuration / (MAX_SEGMENT_DURATION / 1000)) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div className="mt-2">
                <div className="text-xs text-blue-400 mb-1">Progreso total:</div>
                <div className="w-full bg-blue-900/30 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${Math.min((recordingTime / maxDuration) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-center gap-4">
          {/* Botón para seleccionar fuente de audio */}
          {!isSourceSelected && !isRecording && !isPreviewMode && (
            <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full max-w-md" onClick={selectAudioSource}>
              <Monitor className="h-4 w-4 mr-2" />
              Seleccionar fuente de audio
            </Button>
          )}

          {/* Botones para iniciar grabación */}
          {isSourceSelected && !isRecording && (
            <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full max-w-md" onClick={startRecording}>
              <Play className="h-4 w-4 mr-2" />
              Iniciar grabación
            </Button>
          )}

          {/* Botones para pausar/reanudar grabación */}
          {isRecording && (
            <div className="flex w-full max-w-3xl justify-center gap-4">
              {!isPaused ? (
                <Button
                  variant="outline"
                  className="border-blue-600/50 text-blue-300 hover:bg-blue-800/30 w-full"
                  onClick={pauseRecording}
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pausar
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="border-blue-600/50 text-blue-300 hover:bg-blue-800/30 w-full"
                  onClick={resumeRecording}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Continuar
                </Button>
              )}

              <Button
                variant="outline"
                className="border-red-600/50 text-red-400 hover:bg-red-800/30"
                onClick={() => {
                  stopRecording()
                  handleRecordingStopped()
                }}
              >
                <Square className="h-4 w-4 mr-2" />
                Detener
              </Button>
            </div>
          )}

          {/* Botones para guardar/descartar grabación */}
          {!isRecording && recordedChunks.length > 0 && (
            <div className="flex w-full max-w-3xl justify-center gap-4">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={saveRecording}>
                <Save className="h-4 w-4 mr-2" />
                Guardar
              </Button>

              <Button
                variant="outline"
                className="border-red-600/50 text-red-400 hover:bg-red-800/30"
                onClick={discardRecording}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Descartar
              </Button>
            </div>
          )}

          {/* Botón para finalizar sesión */}
          {isSourceSelected && !isRecording && (
            <Button
              variant="outline"
              className="border-red-600/50 text-red-400 hover:bg-red-800/30"
              onClick={() => {
                endSession()
                // Forzar limpieza de canvas después de un pequeño retraso para asegurar que se ejecute después de endSession
                setTimeout(forceCleanCanvas, 50)
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Finalizar
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Diálogo para seleccionar fuente */}
      <Dialog open={isSelectingSource} onOpenChange={(open) => !open && setIsSelectingSource(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seleccionando fuente de audio</DialogTitle>
            <DialogDescription>
              Selecciona la ventana, pestaña o aplicación de la que quieres capturar el audio.
              <div className="mt-2 p-2 bg-muted rounded-md">
                <p className="text-sm font-medium">Consejos:</p>
                <ul className="text-sm list-disc pl-5 mt-1">
                  <li>Asegúrate de marcar "Compartir audio" en el selector del navegador</li>
                  <li>Para reuniones, selecciona la ventana de la aplicación de videoconferencia</li>
                  <li>Para contenido web, selecciona la pestaña específica</li>
                </ul>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  )
}
