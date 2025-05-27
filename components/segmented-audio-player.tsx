"use client"
import { useState, useEffect } from "react"
import { Play, Pause, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SegmentedAudioPlayerProps {
  meetingId: string
  username: string
  startTime: string | null
  endTime: string | null
  speakerName: string
  isLoading: boolean
  error: string | null
  segmentKey: string
  currentPlayingSegment: string | null
  onPlaySegment: (segmentKey: string) => void
}

export default function SegmentedAudioPlayer({
  meetingId,
  username,
  startTime,
  endTime,
  speakerName,
  isLoading,
  error,
  segmentKey,
  currentPlayingSegment,
  onPlaySegment,
}: SegmentedAudioPlayerProps) {
  const [localIsPlaying, setLocalIsPlaying] = useState(false)
  const [playAttempted, setPlayAttempted] = useState(false)

  // Sincronizar el estado local con el estado global
  useEffect(() => {
    const isPlaying = currentPlayingSegment === segmentKey
    setLocalIsPlaying(isPlaying)

    // Si estamos reproduciendo este segmento pero no se ha intentado reproducir localmente,
    // marcarlo como intentado
    if (isPlaying && !playAttempted) {
      setPlayAttempted(true)
    }
  }, [currentPlayingSegment, segmentKey, playAttempted])

  // Función para reproducir o pausar el segmento de audio
  const togglePlayPause = async () => {
    setPlayAttempted(true)
    onPlaySegment(segmentKey)
  }

  // Formatear tiempo para mostrar
  const formatTimeDisplay = (timeStr: string | null): string => {
    if (!timeStr) return "--:--"
    return timeStr
  }

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled className="h-7 px-2 text-blue-400">
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        <span className="text-xs">Cargando</span>
      </Button>
    )
  }

  if (error) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" disabled className="h-7 px-2 text-red-400">
              <AlertCircle className="h-3 w-3 mr-1" />
              <span className="text-xs">Error</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{error}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={togglePlayPause}
            variant="ghost"
            size="sm"
            className={`h-7 px-2 ${localIsPlaying ? "text-green-400" : "text-blue-400"}`}
          >
            {localIsPlaying ? <Pause className="h-3 w-3 mr-1" /> : <Play className="h-3 w-3 mr-1" />}
            <span className="text-xs">{formatTimeDisplay(startTime)}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {localIsPlaying ? "Pausar" : "Reproducir"} segmento de {speakerName}
            {startTime && endTime ? ` (${startTime} - ${endTime})` : ""}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
