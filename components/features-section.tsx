"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { CheckCircle, Zap, Users, Clock, BarChart, MessageSquare } from "lucide-react"

export function FeaturesSection() {
  const sectionRef = useRef<HTMLDivElement>(null)

  // Parallax effect on scroll
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })

  // Transform values for parallax elements
  const titleY = useTransform(scrollYProgress, [0, 1], [50, -50])
  const cardsY = useTransform(scrollYProgress, [0, 1], [100, 0])

  const features = [
    {
      icon: <CheckCircle className="h-8 w-8 text-blue-300" />,
      title: "Actas Inteligentes",
      description: "Genera actas de reunión automáticamente con IA.",
    },
    {
      icon: <Zap className="h-8 w-8 text-blue-300" />,
      title: "Acciones Rápidas",
      description: "Asigna y sigue tareas directamente desde la reunión.",
    },
    {
      icon: <Users className="h-8 w-8 text-blue-300" />,
      title: "Colaboración",
      description: "Trabaja en equipo en tiempo real durante las reuniones.",
    },
    {
      icon: <Clock className="h-8 w-8 text-blue-300" />,
      title: "Ahorro de Tiempo",
      description: "Reduce el tiempo de reuniones hasta en un 40%.",
    },
    {
      icon: <BarChart className="h-8 w-8 text-blue-300" />,
      title: "Análisis",
      description: "Obtén insights sobre la efectividad de tus reuniones.",
    },
    {
      icon: <MessageSquare className="h-8 w-8 text-blue-300" />,
      title: "Transcripción",
      description: "Transcribe automáticamente el audio de tus reuniones.",
    },
  ]

  return (
    <section ref={sectionRef} className="relative min-h-screen w-full py-20 bg-blue-800 overflow-hidden">
      <div className="container px-4 max-w-6xl mx-auto">
        <motion.div className="text-center mb-16" style={{ y: titleY }}>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Características Principales</h2>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Descubre cómo Juntify transforma la manera en que realizas tus reuniones
          </p>
        </motion.div>

        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" style={{ y: cardsY }}>
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true, margin: "-100px" }}
              className="bg-blue-900/50 backdrop-blur-sm p-6 rounded-xl border border-blue-700/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-900/20"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-blue-100">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Bottom wave transition */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden">
        <svg
          className="relative block w-full h-[100px]"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z"
            className="fill-blue-700"
          ></path>
        </svg>
      </div>
    </section>
  )
}
