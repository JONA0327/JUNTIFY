"use client"

import { useState } from "react"
import { Sparkles, Send, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getUsername } from "@/utils/user-helpers"

export function FeedbackButton() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const username = typeof window !== "undefined" ? getUsername() : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")
    setSuccess(false)

    if (!message.trim()) {
      setError("Por favor escribe tu retroalimentación o reporte.")
      setSubmitting(false)
      return
    }

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(username && { "X-Username": username }),
        },
        body: JSON.stringify({ message }),
      })
      if (res.ok) {
        setSuccess(true)
        setMessage("")
      } else {
        setError("Ocurrió un error al enviar tu feedback. Intenta de nuevo.")
      }
    } catch (err) {
      setError("Ocurrió un error al enviar tu feedback. Intenta de nuevo.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* Botón flotante */}
      <button
        className="fixed z-50 bottom-6 right-6 bg-yellow-400 hover:bg-yellow-300 rounded-full shadow-lg p-4 flex items-center justify-center animate-pulse"
        style={{ boxShadow: "0 4px 24px 0 rgba(0,0,0,0.25)" }}
        onClick={() => setOpen(true)}
        aria-label="Enviar feedback"
      >
        <Sparkles className="h-7 w-7 text-blue-900 drop-shadow-glow" />
      </button>

      {/* Modal de feedback */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-blue-800/95 border border-blue-700/30 rounded-xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              className="absolute top-3 right-3 text-blue-200 hover:text-white"
              onClick={() => {
                setOpen(false)
                setSuccess(false)
                setError("")
              }}
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex flex-col items-center mb-4">
              <span className="animate-pulse">
                <Sparkles className="h-10 w-10 text-yellow-300 drop-shadow-glow" />
              </span>
              <h2 className="text-xl font-bold text-white mt-2 mb-1">¿Tienes Algún Comentario?</h2>
              <p className="text-blue-200 text-center text-sm">
                Cuéntanos cómo te ha funcionado Juntify o reporta cualquier error que hayas presentado.
              </p>
            </div>
            <form onSubmit={handleSubmit}>
              <Textarea
                className="w-full bg-blue-900/40 border-blue-700/30 text-white mb-4"
                rows={4}
                placeholder="Escribe aquí tu retroalimentación o reporte de error..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                disabled={submitting}
              />
              <Button
                type="submit"
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold"
                disabled={submitting}
              >
                <Send className="h-4 w-4 mr-2" />
                {submitting ? "Enviando..." : "Enviar feedback"}
              </Button>
            </form>
            {success && (
              <Alert variant="success" className="mt-4 bg-green-900/40 border-green-700 text-white">
                <AlertTitle>¡Gracias!</AlertTitle>
                <AlertDescription>
                  Tu retroalimentación ha sido enviada correctamente.
                </AlertDescription>
              </Alert>
            )}
            {error && (
              <Alert variant="destructive" className="mt-4 bg-red-900/40 border-red-700 text-white">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      )}
    </>
  )
}
