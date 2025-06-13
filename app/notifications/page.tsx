"use client"

import { useEffect, useState } from "react"
import { getUsername } from "@/utils/user-helpers"
import { Button } from "@/components/ui/button"

interface Notification {
  id: number
  username: string
  message: string
  read: boolean
  created_at: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const username = typeof window !== "undefined" ? getUsername() : null

  useEffect(() => {
    async function fetchNotifications() {
      if (!username) return
      try {
        const res = await fetch("/api/notifications", {
          cache: "no-store",
          credentials: "include",
        })
        if (res.ok) {
          const data = await res.json()
          setNotifications(data)
        }
      } catch (err) {
        console.error("Error fetching notifications:", err)
      }
    }
    fetchNotifications()
  }, [username])

  const markAsRead = async (id: number) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: "PATCH" })
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
        )
      }
    } catch (err) {
      console.error("Error updating notification:", err)
    }
  }

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Notificaciones</h1>
      {notifications.length === 0 && (
        <p>No hay notificaciones.</p>
      )}
      <ul className="space-y-2">
        {notifications.map((n) => (
          <li
            key={n.id}
            className={`border p-3 rounded flex justify-between items-center ${n.read ? "opacity-60" : ""}`}
          >
            <span>{n.message}</span>
            {!n.read && (
              <Button size="sm" onClick={() => markAsRead(n.id)}>
                Marcar como leída
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
