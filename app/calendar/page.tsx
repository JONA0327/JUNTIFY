"use client"
import GlobalEventsCalendar from "@/components/global-events-calendar"
import { NewNavbar } from "@/components/new-navbar"

export default function CalendarPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <GlobalEventsCalendar />
      <NewNavbar />
    </div>
  )
}
