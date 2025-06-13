"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { getUsername } from "@/utils/user-helpers"

interface Notification {
  id: number
  username: string
  message: string
  read: boolean
  created_at: string
}

interface Props {
  className?: string
}

export function NotificationDropdown({ className }: Props) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const username = typeof window !== "undefined" ? getUsername() : null

  useEffect(() => {
    if (!open || !username) return
    async function load() {
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
    load()
  }, [open, username])

  const hasUnread = notifications.some((n) => !n.read)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn("relative", className)}
          aria-label="Notificaciones"
        >
          <Bell size={20} />
          {hasUnread && (
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 bg-blue-800/90 border-blue-700/50 text-white">
        <ul className="space-y-2 max-h-60 overflow-y-auto text-sm">
          {notifications.length === 0 ? (
            <li className="text-gray-300">Sin notificaciones</li>
          ) : (
            notifications.map((n) => (
              <li key={n.id} className={cn(n.read && "opacity-60")}>{n.message}</li>
            ))
          )}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
