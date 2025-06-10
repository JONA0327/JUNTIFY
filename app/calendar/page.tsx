"use client"
import GlobalEventsCalendar from "@/components/global-events-calendar"
import { NewNavbar } from "@/components/new-navbar"

export default function CalendarPage() {
  return (
    <div className="min-h-screen bg-blue-900">
      <main className="container mx-auto px-4 py-8">
        <GlobalEventsCalendar />
      </main>
      <NewNavbar />
    </div>
  )
}
