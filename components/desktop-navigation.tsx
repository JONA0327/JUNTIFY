"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Calendar, FileText, User, PlusCircle, Download, MessageSquare, CheckSquare, Menu, X, Sparkles, Bell } from "lucide-react"
import { getUsername } from "@/utils/user-helpers";
export function DesktopNavigation() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const username = typeof window !== "undefined" ? getUsername() : null;
  const isAuthenticated = !!username;
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
 
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])
  // Si está autenticado, oculta "Inicio"

  // Lista completa de elementos de navegación
  const navItems = [
    { name: "Inicio", href: "/", icon: <Home size={20} /> },
    { name: "Reuniones", href: "/dashboard", icon: <Calendar size={20} /> },
    //{ name: "Transcripciones", href: "/transcriptions", icon: <FileText size={20} /> },
    { name: "Nueva Reunión", href: "/new-meeting", icon: <PlusCircle size={20} /> },
    { name: "Tareas", href: "/tasks", icon: <CheckSquare size={20} /> },
    { name: "Notificaciones", href: "/notifications", icon: <Bell size={20} /> },
    { name: "Exportar", href: "/export", icon: <Download size={20} /> },
    { name: "Asistente IA", href: "/ai-assistant", icon: <MessageSquare size={20} /> },
    { name: "Perfil", href: "/profile", icon: <User size={20} /> },
    

  ]
    const filteredNavItems = isAuthenticated
  ? navItems.filter(item => item.name !== "Inicio")
  : [];
  // No mostrar en la página de login
  if (pathname === "/login") {
    return null
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-gray-900/95 shadow-lg backdrop-blur-sm" : "bg-gray-900"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-white">Juntify</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-1 px-2 py-1 rounded-md transition-colors ${
                    isActive ? "text-blue-400 bg-blue-900/30" : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Mobile Menu Button */}
          <button className="md:hidden text-gray-300 hover:text-white" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-gray-900 shadow-lg animate-slide-up">
          <nav className="px-4 py-3 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                    isActive ? "text-blue-400 bg-blue-900/30" : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      )}
    </header>
  )
}
