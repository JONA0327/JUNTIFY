"use client"

import { useState, useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

export function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly")
  const [activeTab, setActiveTab] = useState<"plans" | "additional">("plans")
  const sectionRef = useRef<HTMLDivElement>(null)

  const base = process.env.NEXT_PUBLIC_BASE_URL || "https://juntify.com"

  // Parallax effect on scroll
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })

  // Transform values for parallax elements
  const headingY = useTransform(scrollYProgress, [0, 0.5], [50, -30])
  const subtitleY = useTransform(scrollYProgress, [0, 0.6], [30, -20])
  const plansY = useTransform(scrollYProgress, [0, 0.7], [80, -10])
  const backgroundY = useTransform(scrollYProgress, [0, 1], [0, 50])

  // Features for each plan
  const plans = [
    {
      name: "Freemium",
      price: 0,
      period: "mes",
      description: "Plan gratuito con 5 reuniones/mes de 30 min máx. Ideal para comenzar sin costo.",
      features: ["5 reuniones mensuales", "Duración máxima: 30 minutos", "Funciones básicas", "Soporte por email"],
      popular: false,
      buttonText: "Comenzar Gratis",
      disabled: true,
    },
    {
      name: "Básico",
      price: 499,
      period: "mes",
      description: "Ideal para pequeños negocios y emprendimientos. 10 reuniones/mes (1 hora máx.).",
      features: ["10 reuniones mensuales", "Duración máxima: 1 hora", "Integración básica", "Soporte prioritario"],
      popular: false,
      buttonText: "Seleccionar Plan",
      disabled: true,
    },
    {
      name: "Negocios",
      price: 999,
      period: "mes",
      description:
        "Ideal para negocios con mayor flujo de información por reunión o Profesionistas con despachos, consultorios.",
      features: [
        "20 reuniones mensuales",
        "Duración máxima: 1.5 horas",
        "Análisis avanzado",
        "Colaboración en equipo",
        "Soporte prioritario 24/7",
      ],
      popular: true,
      buttonText: "Seleccionar Plan",
      disabled: true,
    },
  ]

  // Añadir un nuevo plan para Empresas
  const additionalPlans = [
    {
      name: "Empresas",
      price: 2999,
      period: "mes",
      description:
        "Ideal para empresas con reuniones diarias mayores a una hora y mucho flujo de tareas para llevar seguimiento.",
      features: [
        "50 reuniones mensuales",
        "Duración máxima: 3 horas",
        "Análisis avanzado premium",
        "Colaboración ilimitada",
        "Soporte VIP 24/7",
        "Integraciones avanzadas",
      ],
      popular: false,
      buttonText: "Seleccionar Plan",
      disabled: true,
    },
  ]

  return (
    <section ref={sectionRef} className="relative w-full py-24 bg-[#00081e]">
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
            Planes de Reuniones
          </motion.h2>

          {/* Subtitle with parallax effect */}
          <motion.p
            className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto text-center mb-8"
            style={{ y: subtitleY }}
            initial={{ opacity: 1, y: 0 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            La claridad que siempre quisiste para tus reuniones ya está aquí. Es tiempo de elevar la eficiencia,
            simplificar la comunicación y hacer que cada minuto cuente.
          </motion.p>

          {/* Billing cycle selector */}
          <motion.div
            className="mb-8 text-center"
            initial={{ opacity: 1, y: 0 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <p className="text-white mb-4">Elige tu tipo de facturación preferida</p>
            <div className="inline-flex bg-blue-800/30 backdrop-blur-sm rounded-full p-1">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-6 py-2 rounded-full text-sm transition-all ${
                  billingCycle === "monthly"
                    ? "bg-blue-600 text-white"
                    : "bg-transparent text-white/70 hover:text-white"
                }`}
              >
                Mensual
              </button>
              <button
                onClick={() => setBillingCycle("annual")}
                className={`px-6 py-2 rounded-full text-sm transition-all ${
                  billingCycle === "annual" ? "bg-blue-600 text-white" : "bg-transparent text-white/70 hover:text-white"
                }`}
              >
                Anual
              </button>
            </div>
          </motion.div>

          {/* Annual discount badge */}
          {billingCycle === "annual" && (
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-blue-600/30 backdrop-blur-sm text-white px-6 py-2 rounded-full text-sm inline-flex items-center">
                <span className="mr-1">🎉</span> ¡Ahorra hasta un 30% con facturación anual!
              </div>
            </motion.div>
          )}

          {/* Tabs */}
          <motion.div
            className="mb-12 flex justify-center gap-4"
            initial={{ opacity: 1, y: 0 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <button
              onClick={() => setActiveTab("plans")}
              className={`px-8 py-3 rounded-full text-sm transition-all ${
                activeTab === "plans"
                  ? "bg-blue-600 text-white glow-button"
                  : "bg-blue-800/30 backdrop-blur-sm text-white/70 hover:text-white"
              }`}
            >
              Planes
            </button>
            <button
              onClick={() => setActiveTab("additional")}
              className={`px-8 py-3 rounded-full text-sm transition-all ${
                activeTab === "additional"
                  ? "bg-blue-600 text-white glow-button"
                  : "bg-blue-800/30 backdrop-blur-sm text-white/70 hover:text-white"
              }`}
            >
              Reuniones Adicionales
            </button>
          </motion.div>

          {/* Plans grid with parallax effect */}
          {activeTab === "plans" && (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full max-w-7xl"
              style={{ y: plansY }}
              initial={{ opacity: 1, y: 0 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              viewport={{ once: true, amount: 0.1 }}
            >
              {[...plans, ...additionalPlans].map((plan, index) => (
                <motion.div
                  key={index}
                  className={`relative bg-blue-800/20 backdrop-blur-sm border border-blue-700/30 rounded-xl overflow-hidden transition-all hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-900/20 ${
                    plan.popular ? "md:scale-105" : ""
                  }`}
                  initial={{ opacity: 1, y: 0 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                  viewport={{ once: true, amount: 0.1 }}
                >
                  {/* Etiqueta Popular rediseñada */}
                  {plan.popular && (
                    <div className="absolute top-0 right-0">
                      <div className="bg-blue-600 text-white py-1 px-4 font-medium">Popular</div>
                    </div>
                  )}

                  <div className="p-6">
                    {/* Plan name */}
                    <h3 className="text-xl font-semibold text-white mb-1">{plan.name}</h3>
                    <p className="text-sm text-blue-200/70 mb-4">{billingCycle === "monthly" ? "Mensual" : "Anual"}</p>

                    {/* Price */}
                    <div className="flex items-baseline mb-4">
                      <span className="text-white text-lg">$</span>
                      <span className="text-4xl font-bold text-white">
                        {billingCycle === "annual" ? Math.round(plan.price * 0.7) : plan.price}
                      </span>
                      <span className="text-blue-200/70 ml-1">/{plan.period}</span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-blue-100/80 mb-6">{plan.description}</p>

                    {/* Features */}
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start">
                          <Check className="h-5 w-5 text-blue-400 mr-2 shrink-0" />
                          <span className="text-sm text-blue-100/90">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Button */}
                    {plan.disabled ? (
                      <Button
                        className="w-full py-6 text-white bg-blue-800/50 hover:bg-blue-800/50 cursor-not-allowed"
                        disabled
                      >
                        {plan.buttonText}
                      </Button>
                    ) : (
                      <a
                        href={`${base}/nueva-reunion/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full block"
                      >
                        <Button className="w-full py-6 text-white bg-blue-600 hover:bg-blue-700">
                          {plan.buttonText}
                        </Button>
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Additional meetings content */}
          {activeTab === "additional" && (
            <motion.div
              className="bg-blue-800/20 backdrop-blur-sm border border-blue-700/30 rounded-xl p-8 max-w-3xl w-full"
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h3 className="text-2xl font-semibold text-white mb-4">Reuniones Adicionales</h3>
              <p className="text-blue-100/80 mb-6">
                ¿Necesitas más reuniones? Puedes adquirir paquetes adicionales para complementar tu plan actual.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-900/30 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-white mb-2">Paquete Básico</h4>
                  <p className="text-blue-100/70 mb-4">5 reuniones adicionales</p>
                  <div className="flex items-baseline mb-4">
                    <span className="text-white text-lg">$</span>
                    <span className="text-3xl font-bold text-white">199</span>
                  </div>
                  <Button className="w-full bg-blue-800/50 hover:bg-blue-800/50 cursor-not-allowed" disabled>
                    Seleccionar Plan
                  </Button>
                </div>
                <div className="bg-blue-900/30 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-white mb-2">Paquete Premium</h4>
                  <p className="text-blue-100/70 mb-4">10 reuniones adicionales</p>
                  <div className="flex items-baseline mb-4">
                    <span className="text-white text-lg">$</span>
                    <span className="text-3xl font-bold text-white">349</span>
                  </div>
                  <Button className="w-full bg-blue-800/50 hover:bg-blue-800/50 cursor-not-allowed" disabled>
                    Seleccionar Plan
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Call to action */}
          <motion.p
            className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto text-center mt-12"
            initial={{ opacity: 1, y: 0 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            Únete a nuestra lista de espera hoy mismo y obtén acceso exclusivo a 5 reuniones premium completamente
            gratis, para que experimentes por ti mismo el poder transformador de Juntify.
          </motion.p>

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
    </section>
  )
}
