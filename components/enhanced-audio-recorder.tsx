"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Mic, Play, Pause, Square, Trash2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { AudioRecorderService } from "@/utils/audio-recorder-service"

interface EnhancedAudioRecorderProps {
  onRecordingComplete: (audioData: {
    id: string
    url: string
    blob: Blob
    duration: number
    size: number
  }) => void
  disabled?: boolean
}

export function EnhancedAudioRecorder({ onRecordingComplete, disabled = false }: EnhancedAudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [segments, setSegments] = useState<Blob[]>([])
  const [segmentProgress, setSegmentProgress] = useState(0)
  const [showSegmentInfo, setShowSegmentInfo] = useState(false)

  const recorderServiceRef = useRef<AudioRecorderService | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Inicializar el servicio de grabación
  useEffect(() => {
    recorderServiceRef.current = new AudioRecorderService(10) // 10 minutos por segmento

    // Configurar callbacks
    recorderServiceRef.current.onDurationChange((duration) => {
      setRecordingTime(duration)

      // Calcular el progreso dentro del segmento actual (0-100%)
      const segmentDuration = 10 * 60 // 10 minutos en segundos
      const segmentPosition = duration % segmentDuration
      const progress = (segmentPosition / segmentDuration) * 100
      setSegmentProgress(progress)
    })

    recorderServiceRef.current.onNewSegment((segment, segmentNumber) => {
      setSegments((prev) => [...prev, segment])

      // Mostrar información sobre el nuevo segmento
      setShowSegmentInfo(true)
      setTimeout(() => setShowSegmentInfo(false), 3000)
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

      // Iniciar el servicio de grabación
      if (recorderServiceRef.current) {
        const started = await recorderServiceRef.current.startRecording()
        if (!started) {
          throw new Error("No se pudo iniciar la grabación")
        }

        setIsRecording(true)
        setIsPaused(false)

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
      const paused = recorderServiceRef.current.pauseRecording()
      if (paused) {
        setIsPaused(true)

        // Pausar visualización
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
          animationFrameRef.current = null
        }
      }
    }
  }

  // Reanudar grabación
  const resumeRecording = () => {
    if (recorderServiceRef.current && isRecording && isPaused) {
      const resumed = recorderServiceRef.current.resumeRecording()
      if (resumed) {
        setIsPaused(false)

        // Reanudar visualización
        visualizeAudio()
      }
    }
  }

  // Detener grabación
  const stopRecording = async () => {
    if (recorderServiceRef.current && isRecording) {
      try {
        const finalBlob = await recorderServiceRef.current.stopRecording()

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

        setIsRecording(false)
        setIsPaused(false)

        // Verificar que tenemos datos
        if (finalBlob.size > 0) {
          // Crear URL para el blob final
          const audioUrl = URL.createObjectURL(finalBlob)

          // Notificar que la grabación está completa
          onRecordingComplete({
            id: `audio_${Date.now()}`,
            url: audioUrl,
            blob: finalBlob,
            duration: recordingTime,
            size: finalBlob.size,
          })
        } else {
          setError("No se capturaron datos de audio. Intenta grabar de nuevo.")
        }
      } catch (err) {
        console.error("Error al detener la grabación:", err)
        setError(`Error al detener la grabación: ${err instanceof Error ? err.message : "Desconocido"}`)
      }
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

    setIsRecording(false)
    setIsPaused(false)
    setRecordingTime(0)
    setSegments([])
    setError(null)
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Grabador de audio mejorado</span>
          {isRecording && (
            <div className="flex items-center space-x-2">
              <span
                className={`h-2 w-2 rounded-full ${isPaused ? "bg-yellow-500" : "bg-red-500 animate-pulse"}`}
              ></span>
              <span className="text-sm font-normal">{isPaused ? "Pausado" : "Grabando"}</span>
            </div>
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

        {showSegmentInfo && segments.length > 0 && (
          <Alert className="bg-blue-900/50 border-blue-800 text-white">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Nuevo segmento guardado</AlertTitle>
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
            <div className="text-blue-300/70 text-xs sm:text-sm">
              {isRecording
                ? isPaused
                  ? "Grabación pausada"
                  : "Grabando..."
                : disabled
                  ? "Límite de grabaciones alcanzado"
                  : "Listo para grabar"}
            </div>

            {segments.length > 0 && (
              <div className="text-blue-300/70 text-xs mt-1">
                {segments.length} {segments.length === 1 ? "segmento" : "segmentos"} guardados
              </div>
            )}
          </div>
        </div>

        {/* Canvas para el espectrograma */}
        <div className="w-full">
          <canvas ref={canvasRef} width="600" height="100" className="w-full h-16 sm:h-24 rounded-lg bg-blue-900/50" />
        </div>

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
            >
              <Square className="h-4 w-4 mr-2" />
              Detener
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
