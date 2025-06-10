"use client"
import { useState } from "react"
import { Search } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface Evento {
  id: number
  titulo: string
  fecha: string
  hora: string
  color: keyof typeof colorMap
  avatar?: string
}

const colorMap = {
  indigo: { line: "bg-indigo-400", bg: "bg-indigo-400/20" },
  cyan: { line: "bg-cyan-400", bg: "bg-cyan-400/20" },
  green: { line: "bg-green-300", bg: "bg-green-300/20" },
  blue: { line: "bg-blue-400", bg: "bg-blue-400/20" },
  purple: { line: "bg-purple-400", bg: "bg-purple-400/20" },
  red: { line: "bg-red-300", bg: "bg-red-300/20" },
  orange: { line: "bg-orange-300", bg: "bg-orange-300/20" },
}

const eventos: Evento[] = [
  { id: 1, titulo: "Design Review", fecha: "2022-07-01", hora: "14:00 - 16:00", color: "indigo" },
  { id: 2, titulo: "Dinner with Alpha Team", fecha: "2022-07-07", hora: "21:00 - 22:00", color: "cyan" },
  { id: 3, titulo: "Family Trip to a beach and Resort", fecha: "2022-07-15", hora: "09:00 - 18:00", color: "green" },
  { id: 4, titulo: "Grocery", fecha: "2022-07-23", hora: "17:00 - 19:00", color: "blue", avatar: "G" },
  { id: 5, titulo: "Doctor's Visit", fecha: "2022-07-26", hora: "14:00 - 16:00", color: "red", avatar: "D" },
  { id: 6, titulo: "Client Meetup", fecha: "2022-07-29", hora: "22:00 - 23:00", color: "purple", avatar: "C" },
  { id: 7, titulo: "Dart Game", fecha: "2022-07-18", hora: "22:00 - 23:00", color: "orange" },
]

export default function GlobalEventsCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date("2022-07-15"))
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("month")
  const [search, setSearch] = useState("")

  const diasDelMes = Array.from({ length: 31 }, (_, i) => i + 1)
  const eventosHoy = selectedDate
    ? eventos.filter((e) => new Date(e.fecha).toDateString() === selectedDate.toDateString())
    : []

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-xl font-semibold text-white">15 Julio 2022, Lunes</h1>
        <div className="flex-1 md:mx-6">
          <div className="relative max-w-xs mx-auto md:mx-0">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-blue-300" />
            <Input
              placeholder="Buscar"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 bg-blue-800/30 border-blue-700/30 text-white"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant={viewMode === "day" ? "default" : "outline"} onClick={() => setViewMode("day")}>Día</Button>
          <Button variant={viewMode === "week" ? "default" : "outline"} onClick={() => setViewMode("week")}>Semana</Button>
          <Button variant={viewMode === "month" ? "default" : "outline"} onClick={() => setViewMode("month")}>Mes</Button>
          <Button className="bg-purple-700 text-white hover:bg-purple-600">+ Crear Evento</Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-3">
          <Calendar
            mode="single"
            month={new Date(2022, 6)}
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-lg border border-blue-700/30 bg-blue-800/20 text-white mb-6"
          />
          <div className="border border-blue-700/30 bg-blue-800/30 rounded-lg p-4">
            <h2 className="font-semibold mb-2 text-white">Tareas para hoy</h2>
            <ul className="space-y-2 text-sm text-blue-200">
              {eventosHoy.length > 0 ? (
                eventosHoy.map((ev) => (
                  <li key={ev.id} className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${colorMap[ev.color].line}`}></span>
                    {ev.titulo}
                  </li>
                ))
              ) : (
                <li>No hay tareas para este día</li>
              )}
            </ul>
          </div>
        </div>

        <div className="col-span-12 md:col-span-9 border border-blue-700/30 bg-blue-800/20 rounded-lg p-4">
          <div className="grid grid-cols-7 gap-px">
            {diasDelMes.map((day) => {
              const dateStr = `2022-07-${day.toString().padStart(2, "0")}`
              const eventosDelDia = eventos.filter((e) => e.fecha === dateStr)
              return (
                <div key={day} className="min-h-[110px] border border-blue-700/30 p-1">
                  <div className="text-xs text-blue-200 mb-1">{day}</div>
                  {eventosDelDia.map((ev) => (
                    <div key={ev.id} className={`relative mb-1 p-1 pl-2 rounded text-xs ${colorMap[ev.color].bg}`}>
                      <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-l ${colorMap[ev.color].line}`}></span>
                      <div className="flex items-center gap-1">
                        {ev.avatar && (
                          <Avatar className="h-4 w-4">
                            <AvatarFallback className="text-[10px]">{ev.avatar}</AvatarFallback>
                          </Avatar>
                        )}
                        <div className="flex-1">
                          <p className="truncate leading-tight">{ev.titulo}</p>
                          <p className="text-[10px]">{ev.hora}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

