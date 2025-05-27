"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useScroll, useTransform } from "framer-motion"

export function PresentationSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [hasAnimated, setHasAnimated] = useState(false)

  // Parallax effect on scroll
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })

  // Transform values for parallax elements
  const titleY = useTransform(scrollYProgress, [0, 1], [0, -30])
  const subtitleY = useTransform(scrollYProgress, [0, 1], [0, -20])
  const backgroundY = useTransform(scrollYProgress, [0, 1], [0, 50])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true)
        }
      },
      { threshold: 0.3 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current)
      }
    }
  }, [hasAnimated])

  return (
    <section ref={sectionRef} className="relative w-full py-24 bg-[#001033]">
      <motion.div className="absolute inset-0 z-0" style={{ y: backgroundY }} initial={{ y: 0 }} />

      <div className="container relative z-20 px-4 max-w-4xl mx-auto text-center">
        <motion.p
          initial={{ opacity: 1, y: 0 }}
          animate={hasAnimated ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
          className="text-xl md:text-2xl text-white mb-8"
        >
          Presentamos
        </motion.p>

        <motion.h2
          initial={{ opacity: 1, scale: 1 }}
          animate={hasAnimated ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{ y: titleY }}
          className="text-4xl md:text-6xl font-bold text-white mb-10 glow-text"
        >
          Juntify
        </motion.h2>

        <motion.p
          initial={{ opacity: 1, y: 0 }}
          animate={hasAnimated ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.2 }}
          style={{ y: subtitleY }}
          className="text-xl md:text-2xl text-white max-w-3xl mx-auto leading-relaxed"
        >
          Imagina un mundo donde cada conversación se transforma al instante en acciones claras y decisiones precisas.
          Donde el tiempo que inviertes en reuniones deja de ser un costo para convertirse en tu mejor inversión
          estratégica. Esto es lo que hemos logrado con Juntify.
        </motion.p>
      </div>

      {/* Improved gradient transition - much taller and smoother */}
      <div className="absolute bottom-0 left-0 w-full h-[50vh] bg-gradient-to-b from-[#001033] via-[#001c5a] to-[#00277d]"></div>
    </section>
  )
}
