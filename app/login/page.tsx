"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Mail, Lock, User, CheckCircle, AlertCircle, Eye, EyeOff, Users } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export default function LoginPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [remember, setRemember] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [groupCode, setGroupCode] = useState("")

  // Estado para los requisitos de contraseña
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
  })

  // Resetear errores cuando se cambia entre formularios
  useEffect(() => {
    setErrors({})
    setSuccess("")
  }, [isLogin])

  // Marcar que el componente está montado (cliente)
  useEffect(() => {
    setIsMounted(true)

    // Verificar si existe la cookie del token
    const hasToken = document.cookie.includes("token=")
    if (hasToken) {
      router.push("/profile")
    }
  }, [router])

  // Actualizar requisitos de contraseña en tiempo real
  useEffect(() => {
    if (password) {
      setPasswordRequirements({
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
      })
    } else {
      // Resetear requisitos cuando no hay contraseña
      setPasswordRequirements({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
      })
    }
  }, [password])

  // Validar email
  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  // Validar nombre de usuario
  const validateUsername = (username: string): boolean => {
    const re = /^[a-zA-Z0-9_]{3,20}$/
    return re.test(username)
  }

  // Validar contraseña
  const validatePassword = (password: string): boolean => {
    return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password)
  }

  // Validar formulario de registro
  const validateRegisterForm = (): boolean => {
    const newErrors: { [key: string]: string } = {}
    let isValid = true

    if (!name.trim()) {
      newErrors.name = "El nombre es obligatorio"
      isValid = false
    }

    if (!username.trim()) {
      newErrors.username = "El nombre de usuario es obligatorio"
      isValid = false
    } else if (!validateUsername(username)) {
      newErrors.username =
        "El nombre de usuario debe tener entre 3 y 20 caracteres y solo puede contener letras, números y guiones bajos"
      isValid = false
    }

    if (!email.trim()) {
      newErrors.email = "El correo electrónico es obligatorio"
      isValid = false
    } else if (!validateEmail(email)) {
      newErrors.email = "Ingresa un correo electrónico válido"
      isValid = false
    }

    if (!password) {
      newErrors.password = "La contraseña es obligatoria"
      isValid = false
    } else if (!validatePassword(password)) {
      newErrors.password =
        "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial"
      isValid = false
    }

    setErrors(newErrors)

    return isValid
  }

  // Validar formulario de inicio de sesión
  const validateLoginForm = (): boolean => {
    const newErrors: { [key: string]: string } = {}
    let isValid = true

    if (!email.trim()) {
      newErrors.email = "El correo electrónico es obligatorio"
      isValid = false
    }

    if (!password) {
      newErrors.password = "La contraseña es obligatoria"
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setSuccess("")

    if (isLogin) {
      // Proceso de inicio de sesión
      // <<< INICIO: Integración de Facebook Pixel al hacer clic en Login >>>
        if (typeof window !== 'undefined' && window.fbq) {
          window.fbq('track', 'StartTrial', {
            value: 0.00,
            currency: 'USD'
          });
          console.log("Facebook Pixel: StartTrial event triggered on login button click");
        } else {
          console.warn("Facebook Pixel (fbq) not found. Make sure the base code is loaded.");
        }
        // <<< FIN: Integración de Facebook Pixel al hacer clic en Login >>>
      if (validateLoginForm()) {

        setIsSubmitting(true)
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          })

          if (!res.ok) {
            const err = await res.json()
            throw new Error(err.error || "Error al iniciar sesión")
          }

          const data = await res.json()
          if (data.username) {
            localStorage.setItem("juntify_username", data.username)
          }

          setSuccess("¡Inicio de sesión exitoso!")
          setTimeout(() => {
            router.push("/profile")
          }, 1500)
        } catch (error: any) {
          setErrors({ general: error.message || "Error al iniciar sesión. Inténtalo de nuevo más tarde." })
        } finally {
          setIsSubmitting(false)
        }
      }
    } else {
      // Proceso de registro
      if (validateRegisterForm()) {
        setIsSubmitting(true)
        try {
          const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, username, full_name: name }),
          })

          if (!res.ok) {
            const err = await res.json()
            throw new Error(err.error || "Error al crear la cuenta")
          }

          const data = await res.json()

          // 3. Manejar el grupo
          let groupId = null
          let isAdmin = false

            // Si se proporcionó un código de grupo, verificar si existe
            if (groupCode.trim()) {
              try {
                const groupResponse = await fetch("/api/groups/verify", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    code: groupCode.trim(),
                  }),
                })

                if (groupResponse.ok) {
                  const groupData = await groupResponse.json()
                  groupId = groupData.id
                  isAdmin = false // No es administrador si se une a un grupo existente
                } else {
                  // Si el código no es válido, mostrar error
                  const errorData = await groupResponse.json()
                  setErrors({ groupCode: errorData.error || "Código de grupo inválido" })
                  setIsSubmitting(false)
                  return
                }
              } catch (groupError) {
                console.error("Error al verificar código de grupo:", groupError)
                setErrors({ groupCode: "Error al verificar el código de grupo" })
                setIsSubmitting(false)
                return
              }
            } else {
              // Si no se proporcionó código, crear un nuevo grupo
              try {
                const groupResponse = await fetch("/api/groups", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    userId: data.id,
                    username: username,
                    fullName: name,
                  }),
                })

                if (groupResponse.ok) {
                  const groupData = await groupResponse.json()
                  groupId = groupData.id
                  isAdmin = true // Es administrador del nuevo grupo
                }
              } catch (groupError) {
                console.error("Error al crear grupo:", groupError)
                // Continuamos aunque falle la creación del grupo
              }
            }

            // El usuario ya fue guardado en MySQL desde el endpoint de registro

            // 5. Guardar el username en localStorage
            localStorage.setItem("juntify_username", username)
            console.log("Username guardado en localStorage:", username)
            
            // Si también quieres el pixel en el registro, iría aquí.
            // if (typeof window !== 'undefined' && window.fbq) {
            //   window.fbq('track', 'StartTrial', {
            //     value: 0.00,
            //     currency: 'USD'
            //   });
            //   console.log("Facebook Pixel: StartTrial event triggered on registration");
            // } else {
            //   console.warn("Facebook Pixel (fbq) not found. Make sure the base code is loaded.");
            // }
          }

          setSuccess("¡Cuenta creada exitosamente! Ahora puedes iniciar sesión.")

          // Limpiar formulario y cambiar a inicio de sesión
          setTimeout(() => {
            setName("")
            setUsername("")
            setEmail("")
            setPassword("")
            setGroupCode("")
            setIsLogin(true)
          }, 2000)
        } catch (error: any) {
          // Verificar si el error es de username duplicado
          if (error.message?.includes("duplicate key") && error.message?.includes("username")) {
            setErrors({ username: "Este nombre de usuario ya está en uso" })
          } else if (error.message?.includes("User already registered")) {
            setErrors({ email: "Este correo electrónico ya está registrado" })
          } else {
            setErrors({ general: error.message || "Error al crear la cuenta. Inténtalo de nuevo más tarde." })
          }

        } finally {
          setIsSubmitting(false)
        }
      }
    }
  }


  const toggleForm = () => {
    setIsLogin(!isLogin)
    setEmail("")
    setPassword("")
    setName("")
    setUsername("")
    setGroupCode("")
    setErrors({})
    setSuccess("")
  }

  // No renderizar contenido que depende de window hasta que el componente esté montado
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-blue-900 flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-900 flex flex-col">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-700/20 to-blue-900/50 opacity-70" />
        <motion.div
          className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 1,
          }}
        />
      </div>

      {/* Header with back button */}
      <header className="relative z-10 p-6">
        <Link href="/" className="inline-flex items-center text-white/80 hover:text-white transition-colors">
          <ArrowLeft className="mr-2" size={20} />
          <span>Volver al inicio</span>
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md">
          {/* Form container with animation */}
          <motion.div
            className="bg-blue-800/70 backdrop-blur-md rounded-2xl border border-blue-600/30 overflow-hidden shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Form header */}
            <div className="p-6 pb-0 text-center">
              <motion.h1
                className="text-3xl font-bold text-white mb-2 glow-text"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
              </motion.h1>
              <motion.p
                className="text-blue-100/80 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {isLogin
                  ? "Accede a tu cuenta para gestionar tus reuniones"
                  : "Regístrate para comenzar a organizar tus reuniones"}
              </motion.p>
            </div>

            {/* Form */}
            <motion.div
              className="p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {/* Mensajes de éxito o error general */}
              {success && (
                <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                  <span className="text-green-100">{success}</span>
                </div>
              )}

              {errors.general && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                  <span className="text-red-100">{errors.general}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name field (only for register) */}
                {!isLogin && (
                  <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <label htmlFor="name" className="block text-sm font-medium text-blue-100">
                      Nombre completo
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-blue-300" />
                      </div>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required={!isLogin}
                        className={`bg-blue-700/40 border ${
                          errors.name ? "border-red-500/50" : "border-blue-600/50"
                        } text-white placeholder-blue-300/50 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5`}
                        placeholder="Tu nombre completo"
                      />
                    </div>
                    {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                  </motion.div>
                )}

                {/* Username field (only for register) */}
                {!isLogin && (
                  <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <label htmlFor="username" className="block text-sm font-medium text-blue-100">
                      Nombre de usuario
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-blue-300" />
                      </div>
                      <input
                        id="username"
                        name="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required={!isLogin}
                        className={`bg-blue-700/40 border ${
                          errors.username ? "border-red-500/50" : "border-blue-600/50"
                        } text-white placeholder-blue-300/50 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5`}
                        placeholder="Elige un nombre de usuario"
                      />
                    </div>
                    {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username}</p>}
                    {!errors.username && (
                      <p className="text-blue-300/70 text-xs mt-1">
                        El nombre de usuario no podrá ser cambiado después del registro.
                      </p>
                    )}
                  </motion.div>
                )}

                {/* Email field */}
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-blue-100">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-blue-300" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={`bg-blue-700/40 border ${
                        errors.email ? "border-red-500/50" : "border-blue-600/50"
                      } text-white placeholder-blue-300/50 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5`}
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                  {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                </div>

                {/* Password field */}
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-blue-100">
                    Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-blue-300" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className={`bg-blue-700/40 border ${
                        errors.password ? "border-red-500/50" : "border-blue-600/50"
                      } text-white placeholder-blue-300/50 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-10 p-2.5`}
                      placeholder={isLogin ? "Tu contraseña" : "Crea una contraseña"}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-300 hover:text-blue-200"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Requisitos de contraseña (solo para registro) */}
                {!isLogin && (
                  <div className="space-y-1 mt-2">
                    <p className="text-blue-300/70 text-xs">La contraseña debe tener:</p>
                    <ul className="space-y-1">
                      <li className="flex items-center text-xs">
                        <span className={`mr-2 ${passwordRequirements.length ? "text-green-400" : "text-blue-300/70"}`}>
                          {passwordRequirements.length ? "✓" : "○"}
                        </span>
                        <span className={passwordRequirements.length ? "text-green-400" : "text-blue-300/70"}>
                          Al menos 8 caracteres
                        </span>
                      </li>
                      <li className="flex items-center text-xs">
                        <span
                          className={`mr-2 ${passwordRequirements.uppercase ? "text-green-400" : "text-blue-300/70"}`}
                        >
                          {passwordRequirements.uppercase ? "✓" : "○"}
                        </span>
                        <span className={passwordRequirements.uppercase ? "text-green-400" : "text-blue-300/70"}>
                          Al menos una mayúscula
                        </span>
                      </li>
                      <li className="flex items-center text-xs">
                        <span
                          className={`mr-2 ${passwordRequirements.lowercase ? "text-green-400" : "text-blue-300/70"}`}
                        >
                          {passwordRequirements.lowercase ? "✓" : "○"}
                        </span>
                        <span className={passwordRequirements.lowercase ? "text-green-400" : "text-blue-300/70"}>
                          Al menos una minúscula
                        </span>
                      </li>
                      <li className="flex items-center text-xs">
                        <span className={`mr-2 ${passwordRequirements.number ? "text-green-400" : "text-blue-300/70"}`}>
                          {passwordRequirements.number ? "✓" : "○"}
                        </span>
                        <span className={passwordRequirements.number ? "text-green-400" : "text-blue-300/70"}>
                          Al menos un número
                        </span>
                      </li>
                    </ul>
                  </div>
                )}
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
                {!isLogin && !errors.password && (
                  <p className="text-blue-300/70 text-xs mt-1">
                    La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un
                    carácter especial.
                  </p>
                )}

                {/* Remember me & Forgot password (only for login) */}
                {isLogin && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <input
                        id="remember"
                        name="remember"
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-blue-300 rounded"
                      />
                      <label htmlFor="remember" className="ml-2 block text-blue-100">
                        Recordarme
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => alert("Funcionalidad en desarrollo")}
                      className="text-blue-300 hover:text-blue-200"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                )}

                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="groupCode" className="text-blue-200 flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Código de grupo (opcional)
                    </Label>
                    <Input
                      id="groupCode"
                      value={groupCode}
                      onChange={(e) => setGroupCode(e.target.value)}
                      className="bg-blue-700/40 border border-blue-600/50 text-white"
                      placeholder="Deja en blanco para crear tu propio grupo"
                    />
                    {errors.groupCode && <p className="text-red-400 text-xs mt-1">{errors.groupCode}</p>}
                    <p className="text-xs text-blue-300/70">
                      Si tienes un código de grupo, ingrésalo aquí. Si lo dejas en blanco, se creará un nuevo grupo para
                      ti.
                    </p>
                  </div>
                )}

                {/* Submit button */}
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg py-2.5 px-5 text-center transition-all duration-300 hover:shadow-lg hover:shadow-purple-600/30 ${
                    isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                  whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      {isLogin ? "Iniciando sesión..." : "Registrando..."}
                    </span>
                  ) : (
                    <>{isLogin ? "Iniciar Sesión" : "Registrarse"}</>
                  )}
                </motion.button>

                {/* Toggle between login and register */}
                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={toggleForm}
                    className="text-blue-300 hover:text-blue-200 text-sm"
                    disabled={isSubmitting}
                  >
                    {isLogin ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>

          {/* Floating particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {isMounted &&
              Array.from({ length: 5 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-blue-400/30 rounded-full"
                  initial={{
                    x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1000),
                    y: Math.random() * (typeof window !== "undefined" ? window.innerHeight : 1000),
                  }}
                  animate={{
                    y: [null, Math.random() * -500],
                    opacity: [0, 0.8, 0],
                  }}
                  transition={{
                    duration: 10 + Math.random() * 10,
                    repeat: Number.POSITIVE_INFINITY,
                    delay: Math.random() * 5,
                  }}
                />
              ))}
          </div>
        </div>
      </main>
    </div>
  )
}
