// Servicio para manejar la descarga y segmentación de audio

// Tipo para los segmentos de audio
export interface AudioSegment {
  startTime: string | null
  endTime: string | null
  startSeconds: number
  endSeconds: number
  speakerName: string
}

// Clase para manejar la descarga y segmentación de audio
class AudioSegmentService {
  private audioCache: Map<
    string,
    {
      url: string
      segments: Map<string, AudioSegment>
      audio: HTMLAudioElement | null
      isPlaying: boolean
      currentSegmentKey: string | null
      timeUpdateHandler: ((e: Event) => void) | null
    }
  > = new Map()

  // Convertir tiempo de formato "mm:ss" o "hh:mm:ss" a segundos
  timeToSeconds(timeStr: string | null): number {
    if (!timeStr) return 0

    const parts = timeStr.split(":")
    if (parts.length === 2) {
      // Formato mm:ss
      return Number.parseInt(parts[0]) * 60 + Number.parseInt(parts[1])
    } else if (parts.length === 3) {
      // Formato hh:mm:ss
      return Number.parseInt(parts[0]) * 3600 + Number.parseInt(parts[1]) * 60 + Number.parseInt(parts[2])
    }
    return 0
  }

  // Descargar el archivo de audio y preparar los segmentos
  async prepareAudio(meetingId: string, username: string, segments: AudioSegment[]): Promise<boolean> {
    // Si ya tenemos el audio en caché, no necesitamos descargarlo de nuevo
    if (this.audioCache.has(meetingId)) {
      return true
    }

    // Intentar recuperar de sessionStorage primero
    const cachedUrl = sessionStorage.getItem(`audio_url_${meetingId}`)
    if (cachedUrl) {
      try {
        console.log("Usando URL de audio en caché:", cachedUrl)

        // Crear un elemento de audio con la URL en caché
        const audio = new Audio()
        audio.crossOrigin = "anonymous"

        // Configurar eventos antes de asignar la fuente
        await new Promise<void>((resolve, reject) => {
          const onCanPlay = () => {
            audio.removeEventListener("canplaythrough", onCanPlay)
            audio.removeEventListener("error", onError)
            resolve()
          }

          const onError = (e: Event) => {
            audio.removeEventListener("canplaythrough", onCanPlay)
            audio.removeEventListener("error", onError)
            const detail =
              audio.error?.message ??
              (e instanceof ErrorEvent ? e.message : String(e))
            reject(new Error(`Error al cargar el audio desde caché: ${detail}`))
          }

          audio.addEventListener("canplaythrough", onCanPlay)
          audio.addEventListener("error", onError)

          // Establecer un timeout
          const timeout = setTimeout(() => {
            audio.removeEventListener("canplaythrough", onCanPlay)
            audio.removeEventListener("error", onError)
            reject(new Error("Timeout al cargar el audio desde caché"))
          }, 30000)

          // Limpiar el timeout cuando se resuelva
          audio.addEventListener("canplaythrough", () => clearTimeout(timeout), { once: true })
          audio.addEventListener("error", () => clearTimeout(timeout), { once: true })

          // Asignar la fuente después de configurar los eventos
          audio.src = cachedUrl
          audio.load()
        })

        // Guardar en caché
        const segmentsMap = new Map()
        segments.forEach((segment) => {
          const key = `${segment.startTime}-${segment.endTime}`
          segmentsMap.set(key, {
            ...segment,
            startSeconds: this.timeToSeconds(segment.startTime),
            endSeconds: this.timeToSeconds(segment.endTime),
          })
        })

        this.audioCache.set(meetingId, {
          url: cachedUrl,
          segments: segmentsMap,
          audio: audio,
          isPlaying: false,
          currentSegmentKey: null,
          timeUpdateHandler: null,
        })

        console.log(`Audio para reunión ${meetingId} preparado desde caché`)
        return true
      } catch (cacheError) {
        console.warn("Error usando audio en caché, intentando descargar de nuevo:", cacheError)
        // Si falla, continuamos con la descarga normal
        sessionStorage.removeItem(`audio_url_${meetingId}`)
      }
    }

    try {
      console.log(`Descargando audio para la reunión ${meetingId}`)

      // Intentar primero con la URL directa
      let audioUrl = null
      let errorMessage = null

      try {
        // Primero obtenemos la URL directa del audio
        const directResponse = await fetch(`/api/meetings/${meetingId}/audio-direct-url`, {
          headers: {
            "X-Username": username,
          },
        })

        if (directResponse.ok) {
          const directData = await directResponse.json()
          if (directData.directUrl) {
            audioUrl = directData.directUrl
            console.log("URL directa obtenida:", audioUrl)
          }
        } else {
          errorMessage = `Error ${directResponse.status} al obtener URL directa`
          console.warn(errorMessage)
        }
      } catch (directError) {
        errorMessage = `Error al obtener URL directa: ${directError.message}`
        console.warn(errorMessage)
      }

      // Si la URL directa falló, intentar con la URL de descarga
      if (!audioUrl) {
        try {
          console.log("Intentando obtener URL de descarga...")
          const downloadResponse = await fetch(`/api/meetings/${meetingId}/audio-direct-download`, {
            headers: {
              "X-Username": username,
            },
          })

          if (downloadResponse.ok) {
            // Convertir la respuesta a un blob
            const blob = await downloadResponse.blob()

            // Verificar que el blob tiene contenido
            if (blob.size === 0) {
              throw new Error("El archivo descargado está vacío")
            }

            console.log(`Archivo descargado: ${blob.size} bytes, tipo: ${blob.type}`)

            // Crear una URL temporal para el blob
            audioUrl = URL.createObjectURL(blob)
            console.log("URL de blob creada:", audioUrl)
          } else {
            throw new Error(`Error ${downloadResponse.status} al descargar audio`)
          }
        } catch (downloadError) {
          if (errorMessage) {
            errorMessage += ` y error al descargar: ${downloadError.message}`
          } else {
            errorMessage = `Error al descargar audio: ${downloadError.message}`
          }
          console.error(errorMessage)
        }
      }

      // Si no pudimos obtener ninguna URL, lanzar error
      if (!audioUrl) {
        throw new Error(errorMessage || "No se pudo obtener la URL del audio")
      }

      // Crear un elemento de audio
      const audio = new Audio()
      audio.crossOrigin = "anonymous"

      // Esperar a que el audio esté listo para reproducir
      await new Promise<void>((resolve, reject) => {
        const onCanPlay = () => {
          audio.removeEventListener("canplaythrough", onCanPlay)
          audio.removeEventListener("error", onError)
          resolve()
        }

        const onError = (e: Event) => {
          audio.removeEventListener("canplaythrough", onCanPlay)
          audio.removeEventListener("error", onError)
          const detail =
            audio.error?.message ??
            (e instanceof ErrorEvent ? e.message : String(e))
          reject(new Error(`Error al cargar el audio: ${detail}`))
        }

        audio.addEventListener("canplaythrough", onCanPlay)
        audio.addEventListener("error", onError)

        // Establecer un timeout por si la carga tarda demasiado
        const timeout = setTimeout(() => {
          audio.removeEventListener("canplaythrough", onCanPlay)
          audio.removeEventListener("error", onError)
          reject(new Error("Timeout al cargar el audio"))
        }, 30000) // 30 segundos de timeout

        // Limpiar el timeout si se resuelve antes
        audio.addEventListener("canplaythrough", () => clearTimeout(timeout), { once: true })
        audio.addEventListener("error", () => clearTimeout(timeout), { once: true })

        // Asignar la fuente después de configurar los eventos
        audio.src = audioUrl
        audio.load()
      })

      // Guardar en caché
      const segmentsMap = new Map()
      segments.forEach((segment) => {
        const key = `${segment.startTime}-${segment.endTime}`
        segmentsMap.set(key, {
          ...segment,
          startSeconds: this.timeToSeconds(segment.startTime),
          endSeconds: this.timeToSeconds(segment.endTime),
        })
      })

      this.audioCache.set(meetingId, {
        url: audioUrl,
        segments: segmentsMap,
        audio: audio,
        isPlaying: false,
        currentSegmentKey: null,
        timeUpdateHandler: null,
      })

      // Guardar en sessionStorage para persistencia entre recargas
      // Solo guardamos URLs de Google Drive, no blobs
      if (audioUrl.includes("drive.google.com")) {
        sessionStorage.setItem(`audio_url_${meetingId}`, audioUrl)
      }

      console.log(`Audio para reunión ${meetingId} preparado y en caché`)
      return true
    } catch (error) {
      console.error("Error preparando audio:", error)
      throw error
    }
  }

  // Reproducir un segmento específico
  async playSegment(meetingId: string, startTime: string | null, endTime: string | null): Promise<boolean> {
    const cachedAudio = this.audioCache.get(meetingId)
    if (!cachedAudio || !cachedAudio.audio) {
      console.error("Audio no encontrado en caché")
      return false
    }

    const key = `${startTime}-${endTime}`
    const segment = cachedAudio.segments.get(key)

    if (!segment) {
      console.error("Segmento no encontrado")
      return false
    }

    try {
      // Pausar cualquier reproducción actual
      cachedAudio.audio.pause()

      // Establecer el tiempo de inicio
      cachedAudio.audio.currentTime = segment.startSeconds

      // Configurar el evento para detener en el tiempo final
      const handleTimeUpdate = () => {
        if (cachedAudio.audio && cachedAudio.audio.currentTime >= segment.endSeconds) {
          cachedAudio.audio.pause()
          cachedAudio.audio.removeEventListener("timeupdate", handleTimeUpdate)
          cachedAudio.timeUpdateHandler = null
          cachedAudio.isPlaying = false
          cachedAudio.currentSegmentKey = null
        }
      }

      // Limpiar cualquier listener anterior almacenado
      if (cachedAudio.timeUpdateHandler) {
        cachedAudio.audio.removeEventListener("timeupdate", cachedAudio.timeUpdateHandler)
      }

      // Añadir el nuevo listener si hay un tiempo de fin
      if (segment.endSeconds) {
        cachedAudio.audio.addEventListener("timeupdate", handleTimeUpdate)
        cachedAudio.timeUpdateHandler = handleTimeUpdate
      } else {
        cachedAudio.timeUpdateHandler = null
      }

      // Actualizar el estado antes de reproducir
      cachedAudio.isPlaying = true
      cachedAudio.currentSegmentKey = key

      // Iniciar reproducción con un pequeño retraso para asegurar que todo esté listo
      await new Promise<void>((resolve) => setTimeout(resolve, 100))

      try {
        const playPromise = cachedAudio.audio.play()

        // Manejar la promesa de reproducción
        if (playPromise !== undefined) {
          await playPromise
        }

        return true
      } catch (playError) {
        console.error("Error durante la reproducción:", playError)

        // Intentar reproducir nuevamente después de un breve retraso
        await new Promise<void>((resolve) => setTimeout(resolve, 500))

        try {
          await cachedAudio.audio.play()
          return true
        } catch (retryError) {
          console.error("Error en segundo intento de reproducción:", retryError)
          cachedAudio.isPlaying = false
          cachedAudio.currentSegmentKey = null
          return false
        }
      }
    } catch (error) {
      console.error("Error reproduciendo segmento:", error)
      return false
    }
  }

  // Pausar la reproducción actual
  pauseAudio(meetingId: string): boolean {
    const cachedAudio = this.audioCache.get(meetingId)
    if (!cachedAudio || !cachedAudio.audio) {
      return false
    }

    try {
      cachedAudio.audio.pause()
      if (cachedAudio.timeUpdateHandler) {
        cachedAudio.audio.removeEventListener("timeupdate", cachedAudio.timeUpdateHandler)
        cachedAudio.timeUpdateHandler = null
      }
      cachedAudio.isPlaying = false
      return true
    } catch (error) {
      console.error("Error pausando audio:", error)
      return false
    }
  }

  // Verificar si un segmento específico está reproduciéndose
  isSegmentPlaying(meetingId: string, segmentKey: string): boolean {
    const cachedAudio = this.audioCache.get(meetingId)
    if (!cachedAudio) return false

    return cachedAudio.isPlaying && cachedAudio.currentSegmentKey === segmentKey
  }

  // Verificar si un audio está en caché
  isAudioCached(meetingId: string): boolean {
    return this.audioCache.has(meetingId)
  }

  // Obtener la URL del audio en caché
  getCachedAudioUrl(meetingId: string): string | null {
    const cachedAudio = this.audioCache.get(meetingId)
    if (!cachedAudio) {
      // Intentar recuperar de sessionStorage
      const url = sessionStorage.getItem(`audio_url_${meetingId}`)
      if (url) {
        return url
      }
      return null
    }
    return cachedAudio.url
  }

  // Limpiar la caché
  clearCache(): void {
    this.audioCache.forEach((cache) => {
      if (cache.audio) {
        cache.audio.pause()
        if (cache.timeUpdateHandler) {
          cache.audio.removeEventListener("timeupdate", cache.timeUpdateHandler)
          cache.timeUpdateHandler = null
        }
        cache.audio.src = ""
      }
      if (cache.url.startsWith("blob:")) {
        URL.revokeObjectURL(cache.url)
      }
    })
    this.audioCache.clear()
  }
}

// Exportar una instancia única del servicio
export const audioSegmentService = new AudioSegmentService()
