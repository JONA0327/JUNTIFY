"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Calendar,
  FileText,
  User,
  MoreHorizontal,
  PlusCircle,
  Download,
  MessageSquare,
  CheckSquare,
  X,
  Bell,
} from "lucide-react"
import { useVirtualKeyboard } from "@/hooks/use-virtual-keyboard"

export function MobileNavigation() {
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const pathname = usePathname()
  const { isKeyboardVisible } = useVirtualKeyboard()

  // Elementos principales de navegación
  const mainNavItems = [
    { name: "Inicio", href: "/", icon: <Home size={20} /> },
    { name: "Reuniones", href: "/dashboard", icon: <Calendar size={20} /> },
    { name: "Tareas", href: "/tasks", icon: <CheckSquare size={20} /> },
    { name: "Notificaciones", href: "/notifications", icon: <Bell size={20} /> },
    { name: "Perfil", href: "/profile", icon: <User size={20} /> },
  ]

  // Elementos adicionales en el menú expandible
  const moreNavItems = [
    { name: "Nueva Reunión", href: "/new-meeting", icon: <PlusCircle size={20} /> },
    { name: "Transcripciones", href: "/transcriptions", icon: <FileText size={20} /> },
    { name: "Exportar", href: "/export", icon: <Download size={20} /> },
    { name: "Asistente IA", href: "/ai-assistant", icon: <MessageSquare size={20} /> },
  ]

  // No mostrar en la página de login o cuando el teclado está visible
  if (pathname === "/login" || isKeyboardVisible) {
    return null
  }

  return (
    <>
      {/* Barra de navegación fija en la parte inferior */}
      <nav className="fixed bottom-0 left-0 right-0 bg-blue-900 text-white z-50 shadow-lg border-t border-blue-800">
        <div className="flex justify-around items-center h-16">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 px-3 ${
                  isActive ? "text-blue-300 border-t-2 border-blue-300 -mt-[2px] pt-[2px]" : "text-white"
                }`}
              >
                {item.icon}
                <span className="text-xs mt-1">{item.name}</span>
              </Link>
            )
          })}
          <button
            className={`flex flex-col items-center justify-center py-2 px-3 ${
              moreMenuOpen ? "text-blue-300 border-t-2 border-blue-300 -mt-[2px] pt-[2px]" : "text-white"
            }`}
            onClick={() => setMoreMenuOpen(!moreMenuOpen)}
          >
            {moreMenuOpen ? <X size={20} /> : <MoreHorizontal size={20} />}
            <span className="text-xs mt-1">Más</span>
          </button>
        </div>
      </nav>

      {/* Menú expandible "Más" */}
      {moreMenuOpen && (
        <div className="fixed bottom-16 left-0 right-0 bg-blue-800 text-white z-40 shadow-lg animate-slide-up">
          <div className="p-4 grid grid-cols-2 gap-4">
            {moreNavItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg ${
                    isActive ? "bg-blue-700 text-blue-300" : "text-white hover:bg-blue-700/50"
                  }`}
                  onClick={() => setMoreMenuOpen(false)}
                >
                  {item.icon}
                  <span className="text-xs mt-2 text-center">{item.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
