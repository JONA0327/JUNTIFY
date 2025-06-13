"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setMessage("")
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Error")
      }
      setMessage("Si el correo existe, se envió un enlace para restablecer la contraseña")
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-blue-900 flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="bg-blue-800/70 p-6 rounded-xl space-y-4 w-full max-w-md">
        <h1 className="text-2xl font-bold text-white text-center">Recuperar Contraseña</h1>
        {message && <p className="text-green-200 text-center">{message}</p>}
        {error && <p className="text-red-200 text-center">{error}</p>}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-blue-100">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-blue-700/40 border border-blue-600/50 text-white"
          />
        </div>
        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white">
          Enviar enlace
        </Button>
      </form>
    </div>
  )
}
