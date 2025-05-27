"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"

export function AIContextSection() {
  const sectionRef = useRef<HTMLDivElement>(null)

  // Parallax effect on scroll
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })

  // Transform values for parallax elements
  const headingY = useTransform(scrollYProgress, [0, 0.5], [50, -30])
  const subtitleY = useTransform(scrollYProgress, [0, 0.6], [30, -20])
  const featuresY = useTransform(scrollYProgress, [0, 0.7], [80, -10])
  const backgroundY = useTransform(scrollYProgress, [0, 1], [0, 50])

  // Features data
  const features = [
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18" />
          <path d="M9 21V9" />
        </svg>
      ),
      title: "Comprensión Contextual",
      description:
        "Juntify analiza el contexto completo de la conversación, identificando relaciones entre temas y conceptos para ofrecer insights más profundos.",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2" />
          <line x1="9" y1="9" x2="9.01" y2="9" />
          <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
      ),
      title: "Extracción Inteligente",
      description:
        "Identifica automáticamente los puntos clave, decisiones y acciones necesarias, sin importar cuán larga o compleja sea la reunión.",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18" />
          <path d="M9 21V9" />
        </svg>
      ),
      title: "Asignación Precisa",
      description:
        "Reconoce responsabilidades y plazos mencionados durante la conversación, creando automáticamente un plan de acción detallado.",
    },
  ]

  return (
    <section ref={sectionRef} className="relative w-full py-24 bg-[#000e34]">
      {/* Background with parallax effect */}
      <motion.div className="absolute inset-0 z-0" style={{ y: backgroundY }} initial={{ y: 0 }} />

      {/* Content container */}
      <div className="container relative z-20 px-4 mx-auto">
        <div className="flex flex-col items-center justify-center">
          {/* Heading with parallax and glow effect */}
          <motion.h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 glow-text text-center"
            style={{ y: headingY }}
            initial={{ opacity: 1, y: 0 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            Inteligencia Artificial que comprende el contexto
          </motion.h2>

          {/* Subtitle with parallax effect */}
          <motion.p
            className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto text-center mb-16"
            style={{ y: subtitleY }}
            initial={{ opacity: 1, y: 0 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            Se acabaron las reuniones eternas que no conducen a ningún lado; ahora cada encuentro tiene un propósito
            tangible, medible y transformador.
          </motion.p>

          {/* Features grid with parallax effect */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12"
            style={{ y: featuresY }}
            initial={{ opacity: 1, y: 0 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            viewport={{ once: true, amount: 0.1 }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="flex flex-col items-center text-center"
                initial={{ opacity: 1, y: 0 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                viewport={{ once: true, amount: 0.1 }}
              >
                {/* Icon with glow effect */}
                <motion.div
                  className="mb-6 relative"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-xl" />
                  <div className="relative glow-icon p-4">{feature.icon}</div>
                </motion.div>

                {/* Feature title */}
                <h3 className="text-xl md:text-2xl font-semibold text-white mb-4">{feature.title}</h3>

                {/* Feature description */}
                <p className="text-blue-100/80 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Light rays effect */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full">
            <motion.div
              className="w-full h-full bg-gradient-radial from-blue-400 to-transparent"
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.2, 0.3, 0.2],
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

      {/* Gradient transition to next section */}
      <div className="absolute bottom-0 left-0 w-full h-[50vh] bg-gradient-to-b from-[#000e34] via-[#000b29] to-[#00081e]"></div>
    </section>
  )
}
