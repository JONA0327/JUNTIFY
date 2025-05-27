"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import dynamic from "next/dynamic"

// Importar el componente MindMap de forma dinámica para evitar problemas de SSR
const MindMap = dynamic(() => import("./mind-map").then((mod) => mod.MindMap), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-blue-900/30 rounded-lg">
      <div className="text-white text-xl">Cargando visualización...</div>
    </div>
  ),
})

export function IntegratedExperienceSection() {
  const sectionRef = useRef<HTMLDivElement>(null)

  // Parallax effect on scroll
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })

  // Transform values for parallax elements
  const headingY = useTransform(scrollYProgress, [0, 0.5], [50, -30])
  const subtitleY = useTransform(scrollYProgress, [0, 0.6], [30, -20])
  const mindMapY = useTransform(scrollYProgress, [0, 0.7], [100, -20])
  const mindMapScale = useTransform(scrollYProgress, [0, 0.5], [0.9, 1])
  const mindMapOpacity = useTransform(scrollYProgress, [0, 0.3], [0.6, 1])
  const backgroundY = useTransform(scrollYProgress, [0, 1], [0, 50])

  return (
    <section ref={sectionRef} className="relative w-full py-24 bg-[#00277d]">
      {/* Background with parallax effect */}
      <motion.div className="absolute inset-0 z-0" style={{ y: backgroundY }} initial={{ y: 0 }} />

      {/* Content container */}
      <div className="container relative z-20 px-4 mx-auto">
        <div className="flex flex-col items-center justify-center">
          {/* Heading with parallax and glow effect */}
          <motion.h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-8 glow-text text-center"
            style={{ y: headingY }}
            initial={{ opacity: 1, y: 0 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            Una experiencia perfectamente integrada
          </motion.h2>

          {/* Subtitle with description */}
          <motion.p
            className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto text-center mb-16"
            style={{ y: subtitleY }}
            initial={{ opacity: 1, y: 0 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            Nuestra plataforma es intuitiva, elegantemente diseñada y se integra perfectamente con las herramientas que
            ya utilizas. No necesitarás adaptar tus procesos a Juntify; Juntify se adapta a ti.
          </motion.p>

          {/* Mind Map con parallax effect */}
          <motion.div
            className="w-full h-[500px] max-w-4xl mx-auto relative"
            style={{
              y: mindMapY,
              scale: mindMapScale,
              opacity: mindMapOpacity,
            }}
            initial={{ opacity: 1, y: 0 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <div className="w-full h-full rounded-lg overflow-hidden shadow-2xl">
              <MindMap />
            </div>

            {/* Floating elements for visual interest */}
            <motion.div
              className="absolute -top-10 -right-10 w-20 h-20 bg-blue-400/10 rounded-full blur-xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
            />
            <motion.div
              className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-400/10 rounded-full blur-xl"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY, delay: 1 }}
            />
          </motion.div>
        </div>
      </div>

      {/* Gradient transition to next section - matching with the next section */}
      <div className="absolute bottom-0 left-0 w-full h-[50vh] bg-gradient-to-b from-[#00277d] via-[#001c68] to-[#001552]"></div>
    </section>
  )
}
