"use client"

import { useEffect, useState } from "react"
import { NewNavbar } from "@/components/new-navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Feedback {
  id: number
  username: string | null
  message: string
  created_at: string
}

export default function FeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [showDelete, setShowDelete] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const refresh = async () => {
    const res = await fetch("/api/feedback")
    if (res.ok) {
      const data = await res.json()
      setFeedbacks(data)
    }
  }

  useEffect(() => {
    async function fetchFeedbacks() {
      await refresh()
    }
    fetchFeedbacks()
  }, [])

  const confirmDelete = (id: number) => {
    setDeleteId(id)
    setShowDelete(true)
  }

  const handleDelete = async () => {
    if (deleteId === null) return
    await fetch(`/api/feedback/${deleteId}`, { method: "DELETE" })
    setShowDelete(false)
    setDeleteId(null)
    refresh()
  }

  const grouped = feedbacks.reduce((acc: Record<string, Feedback[]>, fb) => {
    const date = new Date(fb.created_at).toLocaleDateString()
    acc[date] = acc[date] || []
    acc[date].push(fb)
    return acc
  }, {})

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="min-h-screen bg-blue-900">
      <main className="container mx-auto px-4 pb-24 pt-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold text-white mb-4 glow-text">Feedbacks</h1>
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <h2 className="text-xl text-blue-100 font-semibold mb-2">{date}</h2>
              <div className="space-y-4">
                {items.map((fb) => (
                  <Card key={fb.id} className="bg-blue-800/30 border-blue-700/30 text-white">
                    <CardHeader className="flex flex-row justify-between items-start">
                      <CardTitle className="text-sm">{fb.username || "Anónimo"}</CardTitle>
                      <div className="flex items-center gap-2">
                        <span className="text-blue-300 text-xs">{formatTime(fb.created_at)}</span>
                        <Button variant="ghost" size="icon" onClick={() => confirmDelete(fb.id)} aria-label="Eliminar">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap">{fb.message}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent className="bg-blue-800/90 border border-blue-700/50">
          <DialogHeader>
            <DialogTitle>Eliminar Feedback</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este feedback?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="secondary" onClick={() => setShowDelete(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <NewNavbar />
    </div>
  )
}
