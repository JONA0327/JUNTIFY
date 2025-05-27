"use client"

import { useEffect, useRef } from "react"

interface StarFieldProps {
  mousePosition: { x: number; y: number }
}

export function StarField({ mousePosition }: StarFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const starsRef = useRef<{ x: number; y: number; size: number; brightness: number }[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas to full screen
    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      createStars()
    }

    // Create stars once and store them in a ref
    function createStars() {
      starsRef.current = []
      const starCount = Math.floor((canvas.width * canvas.height) / 3000)

      for (let i = 0; i < starCount; i++) {
        starsRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 1.2,
          brightness: 0.3 + Math.random() * 0.7,
        })
      }
    }

    window.addEventListener("resize", handleResize)
    handleResize()

    // Animation loop
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Create a gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, "#000000")
      gradient.addColorStop(1, "#000c29")

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw stars - sin movimiento basado en la posición del ratón
      starsRef.current.forEach((star) => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`

        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fill()
      })

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, []) // Eliminamos la dependencia de mousePosition ya que no la usamos

  return <canvas ref={canvasRef} className="absolute inset-0" />
}
