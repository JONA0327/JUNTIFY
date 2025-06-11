"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { addUsernameToHeaders } from "@/utils/user-helpers"

interface Meeting { id: number; title: string }

interface AddToContainerModalProps {
  containerId: number
  onClose: () => void
  onAdded: () => void
}

export function AddToContainerModal({ containerId, onClose, onAdded }: AddToContainerModalProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [selected, setSelected] = useState<number | null>(null)

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const res = await fetch("/api/meetings", { headers: addUsernameToHeaders() })
        if (res.ok) {
          const data = await res.json()
          setMeetings(data)
        }
      } catch (err) {
        console.error("Error loading meetings", err)
      }
    }
    fetchMeetings()
  }, [])

  const handleAdd = async () => {
    if (!selected) return
    try {
      const res = await fetch(`/api/containers/${containerId}/meetings`, {
        method: "POST",
        headers: addUsernameToHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ meetingId: selected }),
      })
      if (res.ok) {
        onAdded()
        onClose()
      }
    } catch (err) {
      console.error("Error adding meeting", err)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-blue-800/95 border border-blue-700/30 rounded-lg p-6 w-full max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white">Añadir reunión</h2>
          <Button variant="ghost" size="icon" className="text-blue-200 hover:text-white" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {meetings.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelected(m.id)}
              className={`w-full text-left px-3 py-2 rounded ${selected === m.id ? "bg-blue-600" : "bg-blue-700/40 hover:bg-blue-700/60"}`}
            >
              {m.title}
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleAdd}>Añadir</Button>
        </div>
      </div>
    </div>
  )
}
