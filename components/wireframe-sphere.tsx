"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

export function WireframeSphere() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Setup Three.js scene
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
    camera.position.z = 200

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    })
    renderer.setSize(600, 600)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    containerRef.current.appendChild(renderer.domElement)

    // Create wireframe sphere
    const geometry = new THREE.SphereGeometry(100, 24, 24)
    const material = new THREE.MeshBasicMaterial({
      color: 0x0088ff,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    })
    const sphere = new THREE.Mesh(geometry, material)
    scene.add(sphere)

    // Add inner glow sphere
    const glowGeometry = new THREE.SphereGeometry(90, 24, 24)
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x0088ff,
      transparent: true,
      opacity: 0.15,
    })
    const glowSphere = new THREE.Mesh(glowGeometry, glowMaterial)
    scene.add(glowSphere)

    // Animation loop con requestAnimationFrame limitado
    let lastTime = 0
    const interval = 1000 / 30 // Limitar a 30 FPS para mejor rendimiento

    const animate = (currentTime: number) => {
      requestAnimationFrame(animate)

      // Limitar la tasa de fotogramas
      if (currentTime - lastTime < interval) return
      lastTime = currentTime

      // Rotate sphere ONLY on Y axis (horizontal rotation)
      sphere.rotation.y += 0.008
      glowSphere.rotation.y += 0.008

      // No rotation on X axis anymore
      // sphere.rotation.x = 0
      // glowSphere.rotation.x = 0

      renderer.render(scene, camera)
    }

    animate(0)

    // Handle resize
    const handleResize = () => {
      renderer.setSize(600, 600)
    }

    window.addEventListener("resize", handleResize)

    return () => {
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement)
      }
      // Liberar memoria
      geometry.dispose()
      material.dispose()
      glowGeometry.dispose()
      glowMaterial.dispose()
      renderer.dispose()

      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return <div ref={containerRef} className="w-full h-full flex items-center justify-center" />
}
