"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"

export function TransformWorkSection() {
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
      title: "Captura Perfecta",
      description:
        "Un sistema de grabación avanzado que captura cada matiz de la conversación con una claridad excepcional, independientemente del entorno.",
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
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <path d="M14 9a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h2l3 3v-3h1a2 2 0 0 0 2-2V9z" />
        </svg>
      ),
      title: "Transcripción Precisa",
      description:
        "Algoritmos de última generación que convierten el habla en texto con una precisión sin precedentes, incluso en entornos ruidosos.",
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
          <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
          <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
          <line x1="6" x2="6" y1="2" y2="4" />
          <line x1="10" x2="10" y1="2" y2="4" />
          <line x1="14" x2="14" y1="2" y2="4" />
        </svg>
      ),
      title: "Reconocimiento de Hablantes",
      description:
        "Tecnología biométrica avanzada que identifica y diferencia a cada participante, incluso cuando hablan simultáneamente.",
    },
  ]

  return (
    <section ref={sectionRef} className="relative w-full py-24 bg-[#001552]">
      {/* Background with parallax effect */}
      <motion.div className="absolute inset-0 z-0" style={{ y: backgroundY }} />

      {/* Content container */}
      <div className="container relative z-20 px-4 mx-auto">
        <div className="flex flex-col items-center justify-center">
          {/* Heading with parallax and glow effect */}
          <motion.h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 glow-text text-center"
            style={{ y: headingY }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            Diseñado para transformar la forma en que trabajamos.
          </motion.h2>

          {/* Subtitle with parallax effect */}
          <motion.p
            className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto text-center mb-16"
            style={{ y: subtitleY }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            Cada aspecto de Juntify ha sido meticulosamente diseñado para ofrecer una experiencia excepcional y
            resultados tangibles.
          </motion.p>

          {/* Features grid with parallax effect */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12"
            style={{ y: featuresY }}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="flex flex-col items-center text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.2 }}
                viewport={{ once: true, margin: "-100px" }}
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

      {/* Gradient transition to next section - updated to match with AI section */}
      <div className="absolute bottom-0 left-0 w-full h-[50vh] bg-gradient-to-b from-[#001552] via-[#001243] to-[#000e34]"></div>
    </section>
  )
}
