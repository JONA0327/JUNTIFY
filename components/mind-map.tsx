"use client"

import { useRef, useEffect, useState } from "react"
import { MessageSquare, Video, Calendar, Upload, Mic, Brain, VideoIcon } from "lucide-react"

// Componente para los nodos de integración
function IntegrationNode({ position, icon, label, color, delay, index }) {
  // Calcular valores de animación únicos para cada nodo
  const floatX = 5 + (index % 3) * 2
  const floatY = 4 + (index % 2) * 3
  const floatSpeed = 3 + (index % 3)
  const floatPhase = index * 0.5

  return (
    <div
      className="absolute flex flex-col items-center"
      style={{
        left: `${position[0]}%`,
        top: `${position[1]}%`,
        transform: "translate(-50%, -50%)",
        opacity: 0,
        animation: `
          fadeIn 0.8s ease-out ${delay}s forwards,
          floatX ${floatSpeed}s ease-in-out ${floatPhase}s infinite alternate,
          floatY ${floatSpeed + 1}s ease-in-out ${floatPhase + 0.5}s infinite alternate
        `,
      }}
    >
      {/* Círculo de fondo con brillo */}
      <div
        className="p-4 rounded-full shadow-glow mb-3 icon-pulse"
        style={{
          backgroundColor: color,
          animation: `iconPulse ${2 + (index % 2)}s infinite alternate ${index * 0.3}s`,
        }}
      >
        {icon}
      </div>

      {/* Etiqueta */}
      <div className="text-white text-sm font-medium whitespace-nowrap bg-blue-900/50 px-3 py-1 rounded-full backdrop-blur-sm">
        {label}
      </div>
    </div>
  )
}

export function MindMap() {
  const containerRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  // Posiciones de los nodos (distribuidos en un círculo más amplio alrededor del centro)
  const nodePositions = [
    [80, 50], // WhatsApp (derecha)
    [70, 25], // Zoom (derecha arriba)
    [50, 20], // Google Calendar (arriba)
    [30, 25], // Meets (izquierda arriba)
    [20, 50], // Subida de Archivos (izquierda)
    [30, 75], // Grabación (izquierda abajo)
    [50, 80], // Análisis GPT (abajo)
    [70, 75], // Teams (derecha abajo)
  ]

  const nodeColors = [
    "#25D366", // WhatsApp (verde)
    "#2D8CFF", // Zoom (azul)
    "#4285F4", // Google Calendar (azul Google)
    "#00897B", // Meets (verde-azulado)
    "#FF9800", // Subida de Archivos (naranja)
    "#F44336", // Grabación (rojo)
    "#9C27B0", // Análisis GPT (morado)
    "#6264A7", // Teams (morado-azulado)
  ]

  useEffect(() => {
    // Detectar cuando el componente es visible en el viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 },
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <div ref={containerRef} className="relative w-full h-full bg-blue-900/20 rounded-lg overflow-hidden">
      {/* Efectos de fondo */}
      <div className="absolute inset-0 bg-gradient-radial from-blue-500/10 to-transparent"></div>
      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=800&width=800')] bg-center opacity-5"></div>

      {/* Partículas flotantes */}
      <div className="particles"></div>

      {/* Círculos concéntricos animados */}
      <div className="absolute left-1/2 top-1/2 w-[300px] h-[300px] -translate-x-1/2 -translate-y-1/2">
        <div className="absolute inset-0 border border-blue-400/10 rounded-full animate-expand-slow"></div>
        <div className="absolute inset-0 border border-blue-400/10 rounded-full animate-expand-slow animation-delay-500"></div>
        <div className="absolute inset-0 border border-blue-400/10 rounded-full animate-expand-slow animation-delay-1000"></div>
      </div>

      {/* Nodo central */}
      <div
        className={`absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 transition-all duration-1000 ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-50"}`}
      >
        <div className="relative">
          {/* Palabra Juntify - Sin círculo detrás */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-400 px-10 py-5 rounded-full shadow-glow relative z-10">
            <h3 className="text-4xl font-bold text-white glow-text">Juntify</h3>
          </div>

          {/* Anillo decorativo */}
          <div className="absolute inset-0 border-4 border-blue-400/30 rounded-full scale-110 animate-spin-slow"></div>
        </div>
      </div>

      {/* Nodos de integración */}
      {isVisible &&
        nodePositions.map((pos, index) => (
          <IntegrationNode
            key={index}
            position={pos}
            icon={
              index === 0 ? (
                <MessageSquare size={24} className="text-white" />
              ) : index === 1 ? (
                <Video size={24} className="text-white" />
              ) : index === 2 ? (
                <Calendar size={24} className="text-white" />
              ) : index === 3 ? (
                <VideoIcon size={24} className="text-white" />
              ) : index === 4 ? (
                <Upload size={24} className="text-white" />
              ) : index === 5 ? (
                <Mic size={24} className="text-white" />
              ) : index === 6 ? (
                <Brain size={24} className="text-white" />
              ) : (
                <MessageSquare size={24} className="text-white" />
              )
            }
            label={
              index === 0
                ? "WhatsApp"
                : index === 1
                  ? "Zoom"
                  : index === 2
                    ? "Google Calendar"
                    : index === 3
                      ? "Google Meets"
                      : index === 4
                        ? "Subida de Archivos"
                        : index === 5
                          ? "Grabación"
                          : index === 6
                            ? "Análisis GPT"
                            : "Teams"
            }
            color={nodeColors[index]}
            delay={0.3 + index * 0.15}
            index={index}
          />
        ))}
    </div>
  )
}
