"use client"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function ResetPasswordPage() {
  const params = useSearchParams()
  const token = params.get("token") || ""
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setMessage("")
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Error")
      }
      setMessage("Contraseña actualizada")
      setTimeout(() => router.push("/login"), 1500)
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-blue-900 flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="bg-blue-800/70 p-6 rounded-xl space-y-4 w-full max-w-md">
        <h1 className="text-2xl font-bold text-white text-center">Cambiar Contraseña</h1>
        {message && <p className="text-green-200 text-center">{message}</p>}
        {error && <p className="text-red-200 text-center">{error}</p>}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-blue-100">Nueva contraseña</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-blue-700/40 border border-blue-600/50 text-white"
          />
        </div>
        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white">
          Cambiar contraseña
        </Button>
      </form>
    </div>
  )
}
