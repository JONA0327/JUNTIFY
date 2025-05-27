// Servicio para manejar grabaciones largas por segmentos
export class AudioRecorderService {
  private mediaRecorder: MediaRecorder | null = null
  private stream: MediaStream | null = null
  private segments: Blob[] = []
  private currentSegment: Blob[] = []
  private segmentDuration = 10 * 60 * 1000 // 10 minutos por segmento
  private segmentTimer: NodeJS.Timeout | null = null
  private isRecording = false
  private totalDuration = 0
  private durationTimer: NodeJS.Timeout | null = null
  private onDurationChangeCallback: ((duration: number) => void) | null = null
  private onNewSegmentCallback: ((segment: Blob, segmentNumber: number) => void) | null = null

  constructor(segmentDurationMinutes = 10) {
    this.segmentDuration = segmentDurationMinutes * 60 * 1000
  }

  async startRecording(audioConstraints: MediaTrackConstraints = {}) {
    try {
      // Limpiar cualquier grabación anterior
      this.reset()

      // Obtener acceso al micrófono
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          ...audioConstraints,
        },
      })

      // Configurar el MediaRecorder
      const options = { mimeType: "audio/webm;codecs=opus" }
      try {
        this.mediaRecorder = new MediaRecorder(this.stream, options)
      } catch (e) {
        console.warn("Formato no soportado, usando configuración predeterminada", e)
        this.mediaRecorder = new MediaRecorder(this.stream)
      }

      // Configurar eventos
      this.mediaRecorder.ondataavailable = this.handleDataAvailable.bind(this)
      this.mediaRecorder.onstop = this.handleSegmentComplete.bind(this)
      this.mediaRecorder.onerror = this.handleError.bind(this)

      // Iniciar grabación
      this.mediaRecorder.start(1000) // Recopilar datos cada segundo
      this.isRecording = true

      // Iniciar temporizador para el segmento actual
      this.startSegmentTimer()

      // Iniciar temporizador para la duración total
      this.startDurationTimer()

      return true
    } catch (error) {
      console.error("Error al iniciar la grabación:", error)
      this.reset()
      return false
    }
  }

  private startSegmentTimer() {
    // Crear un nuevo segmento cada X minutos
    this.segmentTimer = setTimeout(() => {
      if (this.isRecording && this.mediaRecorder && this.mediaRecorder.state === "recording") {
        // Detener el grabador actual para finalizar el segmento
        this.mediaRecorder.stop()

        // Reiniciar inmediatamente con un nuevo MediaRecorder
        setTimeout(() => {
          if (this.isRecording && this.stream) {
            try {
              const options = { mimeType: "audio/webm;codecs=opus" }
              try {
                this.mediaRecorder = new MediaRecorder(this.stream, options)
              } catch (e) {
                this.mediaRecorder = new MediaRecorder(this.stream)
              }

              this.mediaRecorder.ondataavailable = this.handleDataAvailable.bind(this)
              this.mediaRecorder.onstop = this.handleSegmentComplete.bind(this)
              this.mediaRecorder.onerror = this.handleError.bind(this)

              this.mediaRecorder.start(1000)
              this.startSegmentTimer()
            } catch (error) {
              console.error("Error al reiniciar la grabación:", error)
              this.stopRecording()
            }
          }
        }, 100)
      }
    }, this.segmentDuration)
  }

  private startDurationTimer() {
    this.totalDuration = 0
    this.durationTimer = setInterval(() => {
      this.totalDuration += 1
      if (this.onDurationChangeCallback) {
        this.onDurationChangeCallback(this.totalDuration)
      }
    }, 1000)
  }

  private handleDataAvailable(event: BlobEvent) {
    if (event.data && event.data.size > 0) {
      this.currentSegment.push(event.data)
    }
  }

  private handleSegmentComplete() {
    if (this.currentSegment.length > 0) {
      const segmentBlob = new Blob(this.currentSegment, { type: "audio/webm" })
      this.segments.push(segmentBlob)

      // Notificar sobre el nuevo segmento
      if (this.onNewSegmentCallback) {
        this.onNewSegmentCallback(segmentBlob, this.segments.length)
      }

      // Limpiar el segmento actual
      this.currentSegment = []
    }
  }

  private handleError(event: Event) {
    console.error("Error en MediaRecorder:", event)
    // Intentar recuperarse del error
    this.stopRecording()
  }

  pauseRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
      this.mediaRecorder.pause()

      // Pausar temporizadores
      if (this.segmentTimer) {
        clearTimeout(this.segmentTimer)
      }

      if (this.durationTimer) {
        clearInterval(this.durationTimer)
      }

      return true
    }
    return false
  }

  resumeRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === "paused") {
      this.mediaRecorder.resume()

      // Reiniciar temporizadores
      this.startSegmentTimer()

      this.durationTimer = setInterval(() => {
        this.totalDuration += 1
        if (this.onDurationChangeCallback) {
          this.onDurationChangeCallback(this.totalDuration)
        }
      }, 1000)

      return true
    }
    return false
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      const finalize = () => {
        // Detener temporizadores
        if (this.segmentTimer) {
          clearTimeout(this.segmentTimer)
          this.segmentTimer = null
        }

        if (this.durationTimer) {
          clearInterval(this.durationTimer)
          this.durationTimer = null
        }

        // Detener y liberar el stream
        if (this.stream) {
          this.stream.getTracks().forEach((track) => track.stop())
          this.stream = null
        }

        this.isRecording = false

        // Combinar todos los segmentos en un solo blob
        if (this.currentSegment.length > 0) {
          const lastSegment = new Blob(this.currentSegment, { type: "audio/webm" })
          this.segments.push(lastSegment)
          this.currentSegment = []
        }

        if (this.segments.length > 0) {
          const finalBlob = new Blob(this.segments, { type: "audio/webm" })
          resolve(finalBlob)
        } else {
          resolve(new Blob([], { type: "audio/webm" }))
        }
      }

      if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
        // Configurar un manejador de eventos para cuando se detenga
        const originalOnStop = this.mediaRecorder.onstop
        this.mediaRecorder.onstop = (event) => {
          // Llamar al manejador original primero
          if (originalOnStop) {
            originalOnStop.call(this.mediaRecorder, event)
          }

          finalize()
        }

        this.mediaRecorder.stop()
      } else {
        finalize()
      }
    })
  }

  reset() {
    // Detener cualquier grabación en curso
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop()
    }

    // Detener temporizadores
    if (this.segmentTimer) {
      clearTimeout(this.segmentTimer)
      this.segmentTimer = null
    }

    if (this.durationTimer) {
      clearInterval(this.durationTimer)
      this.durationTimer = null
    }

    // Liberar recursos
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
      this.stream = null
    }

    // Reiniciar variables
    this.mediaRecorder = null
    this.segments = []
    this.currentSegment = []
    this.isRecording = false
    this.totalDuration = 0
  }

  // Métodos para configurar callbacks
  onDurationChange(callback: (duration: number) => void) {
    this.onDurationChangeCallback = callback
  }

  onNewSegment(callback: (segment: Blob, segmentNumber: number) => void) {
    this.onNewSegmentCallback = callback
  }

  // Obtener la duración total actual
  getDuration(): number {
    return this.totalDuration
  }

  // Verificar si está grabando actualmente
  isCurrentlyRecording(): boolean {
    return this.isRecording
  }

  // Obtener el número de segmentos grabados
  getSegmentCount(): number {
    return this.segments.length
  }
}
