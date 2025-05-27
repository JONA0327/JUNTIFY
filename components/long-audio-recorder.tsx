"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Mic, Play, Pause, Square, Trash2, AlertCircle, Save, Loader } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { LongRecordingService } from "@/utils/long-recording-service"

interface LongAudioRecorderProps {
  onRecordingComplete: (audioData: {
    id: string
    url: string
    blob: Blob
    duration: number
    size: number
  }) => void
  disabled?: boolean
  maxDurationHours?: number // Duración máxima en horas
}

export function LongAudioRecorder({
  onRecordingComplete,
  disabled = false,
  maxDurationHours = 2, // Por defecto 2 horas
}: LongAudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [segments, setSegments] = useState<Blob[]>([])
  const [segmentProgress, setSegmentProgress] = useState(0)
  const [showSegmentInfo, setShowSegmentInfo] = useState(false)
  const [recordingStatus, setRecordingStatus] = useState("ready")
  const [totalSize, setTotalSize] = useState(0)
  const [batteryWarning, setBatteryWarning] = useState(false)
  const [isStoppingRecording, setIsStoppingRecording] = useState(false)

  const recorderServiceRef = useRef<LongRecordingService | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Calcular el tiempo máximo en segundos
  const maxDurationSeconds = maxDurationHours * 60 * 60

  // Calcular el porcentaje de tiempo transcurrido
  const totalProgressPercent = (recordingTime / maxDurationSeconds) * 100

  // Inicializar el servicio de grabación
  useEffect(() => {
    recorderServiceRef.current = new LongRecordingService(10) // 10 minutos por segmento

    // Configurar callbacks
    recorderServiceRef.current.onDurationChange((duration) => {
      setRecordingTime(duration)

      // Calcular el progreso dentro del segmento actual (0-100%)
      const segmentDuration = 10 * 60 // 10 minutos en segundos
      const segmentPosition = duration % segmentDuration
      const progress = (segmentPosition / segmentDuration) * 100
      setSegmentProgress(progress)

      // Mostrar advertencia de batería después de 30 minutos
      if (duration === 30 * 60) {
        setBatteryWarning(true)
        setTimeout(() => setBatteryWarning(false), 10000) // Ocultar después de 10 segundos
      }
    })

    recorderServiceRef.current.onNewSegment((segment, segmentNumber) => {
      setSegments((prev) => [...prev, segment])

      // Actualizar tamaño total estimado
      if (recorderServiceRef.current) {
        setTotalSize(recorderServiceRef.current.getTotalSize())
      }

      // Mostrar información sobre el nuevo segmento
      setShowSegmentInfo(true)
      setTimeout(() => setShowSegmentInfo(false), 3000)
    })

    recorderServiceRef.current.onStatusChange((status) => {
      setRecordingStatus(status)

      // Actualizar estados de UI basados en el estado
      if (status === "recording") {
        setIsRecording(true)
        setIsPaused(false)
      } else if (status === "paused") {
        setIsPaused(true)
      } else if (status === "error") {
        setError("Se produjo un error durante la grabación. Intente nuevamente.")
      } else if (status === "ready" || status === "completed" || status === "empty") {
        setIsRecording(false)
        setIsPaused(false)
      }
    })

    return () => {
      // Limpiar recursos al desmontar
      if (recorderServiceRef.current) {
        recorderServiceRef.current.reset()
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error)
      }
    }
  }, [])

  // Configurar el analizador de audio para visualización
  const setupAudioAnalyser = async () => {
    try {
      // Obtener acceso al micrófono para visualización
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Crear contexto de audio
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256

      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)

      // Iniciar visualización
      visualizeAudio()
    } catch (err) {
      console.error("Error al configurar el analizador de audio:", err)
    }
  }

  // Función para visualizar el audio
  const visualizeAudio = () => {
    if (!canvasRef.current || !analyserRef.current) return

    const canvas = canvasRef.current
    const canvasCtx = canvas.getContext("2d")
    if (!canvasCtx) return

    const analyser = analyserRef.current
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      if (!isRecording) {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
          animationFrameRef.current = null
        }
        return
      }

      animationFrameRef.current = requestAnimationFrame(draw)

      analyser.getByteFrequencyData(dataArray)

      canvasCtx.fillStyle = "rgb(20, 30, 60)"
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height)

      const barWidth = (canvas.width / bufferLength) * 2.5
      let x = 0

      // Calcular nivel de audio promedio
      let sum = 0
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i]

        // Dibujar barras
        const barHeight = dataArray[i] / 2
        const hue = 220 - (dataArray[i] / 255) * 60 // Azul a celeste
        canvasCtx.fillStyle = `hsla(${hue}, 100%, 60%, 0.8)`
        canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)
        x += barWidth + 1
      }

      const average = sum / bufferLength
      setAudioLevel(average / 255)
    }

    draw()
  }

  // Iniciar grabación
  const startRecording = async () => {
    try {
      setError(null)
      setSegments([])
      setTotalSize(0)

      // Iniciar el servicio de grabación
      if (recorderServiceRef.current) {
        const started = await recorderServiceRef.current.startRecording()
        if (!started) {
          throw new Error("No se pudo iniciar la grabación")
        }

        // Configurar visualización de audio
        await setupAudioAnalyser()
      }
    } catch (err) {
      console.error("Error al iniciar la grabación:", err)
      setError(`Error al iniciar la grabación: ${err instanceof Error ? err.message : "Desconocido"}`)
    }
  }

  // Pausar grabación
  const pauseRecording = () => {
    if (recorderServiceRef.current && isRecording) {
      recorderServiceRef.current.pauseRecording()

      // Pausar visualización
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }

  // Reanudar grabación
  const resumeRecording = () => {
    if (recorderServiceRef.current && isRecording && isPaused) {
      recorderServiceRef.current.resumeRecording()

      // Reanudar visualización
      visualizeAudio()
    }
  }

  // Detener grabación
  const stopRecording = async () => {
    if (!isRecording) return

    try {
      setIsStoppingRecording(true)

      // Detener el servicio de grabación
      if (recorderServiceRef.current) {
        const audioBlob = await recorderServiceRef.current.stopRecording()

        // Actualizar estados
        setIsRecording(false)
        setIsPaused(false)
        setIsStoppingRecording(false)

        // Notificar que la grabación ha terminado
        if (onRecordingComplete && audioBlob) {
          onRecordingComplete({
            id: `audio_${Date.now()}`,
            url: URL.createObjectURL(audioBlob),
            blob: audioBlob,
            duration: recordingTime,
            size: audioBlob.size,
          })
        }

        // Limpiar temporizadores
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }

        setRecordingTime(0)
      }
    } catch (error) {
      console.error("Error al detener la grabación:", error)
      setError(`Error al detener la grabación: ${error instanceof Error ? error.message : "Desconocido"}`)
      setIsStoppingRecording(false)
    }
  }

  // Descartar grabación
  const discardRecording = () => {
    if (recorderServiceRef.current) {
      recorderServiceRef.current.reset()
    }

    // Detener visualización
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    // Detener y liberar el stream de visualización
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    setRecordingTime(0)
    setSegments([])
    setError(null)
    setTotalSize(0)
  }

  // Formatear tiempo
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    } else {
      return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
  }

  // Formatear tamaño
  const formatSize = (sizeInMB: number) => {
    if (sizeInMB < 1) {
      return `${(sizeInMB * 1024).toFixed(0)} KB`
    }
    return `${sizeInMB.toFixed(1)} MB`
  }

  // Obtener el estado de la grabación en texto
  const getStatusText = () => {
    if (recordingStatus === "initializing" || recordingStatus === "configuring") {
      return "Iniciando grabación..."
    } else if (recordingStatus === "recording") {
      return "Grabando..."
    } else if (recordingStatus === "paused") {
      return "Grabación pausada"
    } else if (recordingStatus === "switching_segment") {
      return "Guardando segmento..."
    } else if (recordingStatus === "finalizing") {
      return "Finalizando grabación..."
    } else if (recordingStatus === "completed") {
      return "Grabación completada"
    } else if (recordingStatus === "error") {
      return "Error en la grabación"
    } else if (recordingStatus === "empty") {
      return "No se grabó audio"
    } else {
      return "Listo para grabar"
    }
  }

  return (
    <Card className="w-full bg-blue-800/30 border border-blue-700/30">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-white">
          <span>Grabador de audio extendido</span>
          {isRecording && (
            <Badge
              variant={isPaused ? "outline" : "default"}
              className={isPaused ? "border-yellow-500 text-yellow-400" : "bg-red-500"}
            >
              {isPaused ? "Pausado" : "Grabando"}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive" className="bg-red-900/50 border-red-800 text-white">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {batteryWarning && (
          <Alert className="bg-amber-900/50 border-amber-800 text-white">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Advertencia de batería</AlertTitle>
            <AlertDescription>
              La grabación lleva 30 minutos. Las grabaciones largas pueden consumir mucha batería.
            </AlertDescription>
          </Alert>
        )}

        {showSegmentInfo && segments.length > 0 && (
          <Alert className="bg-blue-900/50 border-blue-800 text-white">
            <Save className="h-4 w-4" />
            <AlertTitle>Segmento guardado</AlertTitle>
            <AlertDescription>
              Segmento {segments.length} completado. La grabación continúa automáticamente.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col items-center">
          <div
            className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full flex items-center justify-center ${
              isRecording
                ? isPaused
                  ? "bg-yellow-600/30"
                  : `bg-red-600/30 ${audioLevel > 0.05 ? "animate-pulse" : ""}`
                : disabled
                  ? "bg-gray-600/30"
                  : "bg-blue-600/30"
            }`}
            style={{
              boxShadow:
                isRecording && !isPaused && audioLevel > 0.05
                  ? `0 0 ${20 + audioLevel * 30}px ${audioLevel * 15}px rgba(239, 68, 68, ${audioLevel * 0.5})`
                  : "none",
            }}
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
            <div className="text-blue-300/70 text-xs sm:text-sm">{getStatusText()}</div>

            {segments.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2 mt-2 text-blue-300/70 text-xs">
                <div className="flex items-center">
                  <Save className="h-3 w-3 mr-1" />
                  <span>
                    {segments.length} {segments.length === 1 ? "segmento" : "segmentos"} guardados
                  </span>
                </div>
                {totalSize > 0 && (
                  <div className="flex items-center">
                    <span className="hidden sm:inline mx-1">•</span>
                    <span>{formatSize(totalSize)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Canvas para el espectrograma */}
        <div className="w-full">
          <canvas ref={canvasRef} width="600" height="100" className="w-full h-16 sm:h-24 rounded-lg bg-blue-900/50" />
        </div>

        {/* Progreso total de la grabación */}
        {isRecording && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-blue-300/70">
              <span>Tiempo total (máx. {maxDurationHours} horas)</span>
              <span>
                {formatTime(recordingTime)} / {formatTime(maxDurationSeconds)}
              </span>
            </div>
            <Progress
              value={totalProgressPercent}
              className="h-2 bg-blue-800/50"
              indicatorClassName={totalProgressPercent > 90 ? "bg-amber-500" : "bg-blue-500"}
            />
          </div>
        )}

        {/* Progreso del segmento actual */}
        {isRecording && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-blue-300/70">
              <span>Progreso del segmento actual</span>
              <span>{Math.round(segmentProgress)}%</span>
            </div>
            <Progress value={segmentProgress} className="h-1 bg-blue-800/50" indicatorClassName="bg-blue-500" />
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-center gap-3 flex-wrap">
        {!isRecording ? (
          <Button
            className={`${
              disabled ? "bg-gray-600 hover:bg-gray-700 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            } text-white`}
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
                className="border-yellow-600/50 text-yellow-400 hover:bg-yellow-800/30"
                onClick={pauseRecording}
              >
                <Pause className="h-4 w-4 mr-2" />
                Pausar
              </Button>
            ) : (
              <Button
                variant="outline"
                className="border-blue-600/50 text-blue-400 hover:bg-blue-800/30"
                onClick={resumeRecording}
              >
                <Play className="h-4 w-4 mr-2" />
                Continuar
              </Button>
            )}

            <Button
              variant="outline"
              className="border-red-600/50 text-red-400 hover:bg-red-800/30"
              onClick={stopRecording}
              disabled={isStoppingRecording}
            >
              {isStoppingRecording ? (
                <Loader className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Square className="h-4 w-4 mr-2" />
              )}
              {isStoppingRecording ? "Deteniendo..." : "Detener"}
            </Button>

            <Button
              variant="outline"
              className="border-red-600/50 text-red-400 hover:bg-red-800/30"
              onClick={discardRecording}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Descartar
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}
