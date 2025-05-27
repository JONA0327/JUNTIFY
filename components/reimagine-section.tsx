"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"

export function ReimagineSection() {
  const sectionRef = useRef<HTMLDivElement>(null)

  // Parallax effect on scroll
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })

  // Transform values for parallax elements
  const headingY = useTransform(scrollYProgress, [0, 0.5], [30, -20])
  const textY = useTransform(scrollYProgress, [0, 0.6], [40, -10])
  const backgroundY = useTransform(scrollYProgress, [0, 1], [0, 50])

  return (
    <section ref={sectionRef} className="relative w-full py-24 bg-[#00277d]">
      {/* Background with parallax effect */}
      <motion.div className="absolute inset-0 z-0" style={{ y: backgroundY }} initial={{ y: 0 }} />

      {/* Content container */}
      <div className="container relative z-20 px-4 max-w-5xl mx-auto">
        <div className="flex flex-col items-center justify-center text-center">
          {/* Heading with parallax and glow effect */}
          <motion.h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-12 glow-text leading-tight"
            style={{ y: headingY }}
            initial={{ opacity: 1, y: 0 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            Un nuevo paradigma para tus reuniones
          </motion.h2>

          {/* Description with parallax effect */}
          <motion.p
            className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed"
            style={{ y: textY }}
            initial={{ opacity: 1, y: 0 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            Juntify no es simplemente una herramienta, es un nuevo paradigma para equipos que valoran la eficacia, la
            precisión y la productividad absoluta. Con nuestra tecnología de inteligencia artificial, cada matiz de tu
            conversación es capturado, comprendido y convertido automáticamente en tareas concretas, asignadas y listas
            para ser ejecutadas.
          </motion.p>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Light rays effect */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full">
            <motion.div
              className="w-full h-full bg-gradient-radial from-blue-400 to-transparent"
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.3, 0.4, 0.3],
              }}
              transition={{
                duration: 8,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
          </div>
        </div>
      </div>

      {/* Gradient transition to next section - matching with the next section */}
      <div className="absolute bottom-0 left-0 w-full h-[50vh] bg-gradient-to-b from-[#00277d] to-[#00277d]"></div>
    </section>
  )
}
