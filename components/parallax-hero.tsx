"use client"

import { useRef } from "react"
import { StarField } from "@/components/star-field"
import { WireframeSphere } from "@/components/wireframe-sphere"
import { motion, useScroll, useTransform } from "framer-motion"
import Link from "next/link"

export function ParallaxHero() {
  const containerRef = useRef<HTMLDivElement>(null)

  // Parallax effect on scroll
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  })

  // Transform values for parallax elements
  const sphereScale = useTransform(scrollYProgress, [0, 1], [1, 0.8])
  const sphereOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const textY = useTransform(scrollYProgress, [0, 0.5], [0, -50])
  const textOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <div ref={containerRef} className="relative h-screen w-full flex flex-col items-center justify-center">
      <StarField mousePosition={{ x: 0, y: 0 }} />

      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          scale: sphereScale,
          opacity: sphereOpacity,
        }}
        initial={{ opacity: 1, scale: 1 }}
      >
        <div className="relative w-[600px] h-[600px]">
          <WireframeSphere />
        </div>
      </motion.div>

      <motion.div
        className="relative z-10 flex flex-col items-center justify-center text-center"
        style={{
          y: textY,
          opacity: textOpacity,
        }}
        initial={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-2">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-blue-100 glow-text">
            Juntify
          </span>
        </h1>

        <div className="mb-6">
          <p className="text-xl text-white mb-4">Bienvenido al futuro de tus reuniones.</p>
          <p className="text-sm text-gray-300">
            Porque tu tiempo es valioso, merece ser invertido en resultados extraordinarios.
          </p>
        </div>

        {/* Botones de acción */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Link href="/login?register=true">
            <motion.button
              className="px-8 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-all duration-300 hover:shadow-lg hover:shadow-purple-600/30 w-full sm:w-auto"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Pruébalo gratis
            </motion.button>
          </Link>
        </motion.div>
      </motion.div>

      {/* Improved gradient transition - much taller and smoother */}
      <div className="absolute bottom-0 left-0 w-full h-[50vh] bg-gradient-to-b from-transparent via-[rgba(0,12,41,0.5)] to-[#001033]"></div>
    </div>
  )
}
