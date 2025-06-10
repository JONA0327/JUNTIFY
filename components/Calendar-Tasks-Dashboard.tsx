"use client"

import { useState, useEffect } from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"

// Datos simulados de eventos para el ejemplo
const eventosSimulados = [
  {
    id: 1,
    titulo: "Dinner with Alpha Team",
    fecha: "2022-07-07",
    hora: "21:00 - 22:00",
    color: "bg-cyan-400",
  },
  {
    id: 2,
    titulo: "Design Review",
    fecha: "2022-07-01",
    hora: "14:00 - 16:00",
    color: "bg-indigo-400",
  },
  {
    id: 3,
    titulo: "Family Trip to a beach and Resort",
    fecha: "2022-07-15",
    hora: "09:00 - 18:00",
    color: "bg-green-300",
  },
  {
    id: 4,
    titulo: "Grocery",
    fecha: "2022-07-23",
    hora: "17:00 - 19:00",
    color: "bg-blue-400",
  },
  {
    id: 5,
    titulo: "Client Meetup",
    fecha: "2022-07-29",
    hora: "22:00 - 23:00",
    color: "bg-purple-400",
  },
  {
    id: 6,
    titulo: "Doctor's Visit",
    fecha: "2022-07-26",
    hora: "14:00 - 16:00",
    color: "bg-red-300",
  },
  {
    id: 7,
    titulo: "Dart Game",
    fecha: "2022-07-18",
    hora: "22:00 - 23:00",
    color: "bg-orange-300",
  },
]

export default function CalendarioEventos() {
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | undefined>(new Date("2022-07-15"))

  const eventosHoy = eventosSimulados.filter(
    (evento) => new Date(evento.fecha).toDateString() === (fechaSeleccionada?.toDateString() ?? "")
  )

  return (
    <div className="min-h-screen bg-white text-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">15 July 2022, Monday</h1>
          <div className="flex gap-2">
            <Button variant="outline">Day</Button>
            <Button variant="outline">Week</Button>
            <Button className="bg-indigo-600 text-white">Month</Button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Panel lateral */}
          <div className="col-span-3">
            <Calendar
              mode="single"
              selected={fechaSeleccionada}
              onSelect={setFechaSeleccionada}
              className="border rounded-lg mb-6"
            />

            <div className="border rounded-lg p-4">
              <h2 className="font-semibold mb-2">Tasks Due Today</h2>
              <ul className="space-y-2 text-sm">
                {eventosSimulados.map((evento) => (
                  <li key={evento.id} className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${evento.color}`}></span>
                    {evento.titulo.split(" ")[0]}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Calendario mensual simulado */}
          <div className="col-span-9 border rounded-lg p-6 bg-gray-50">
            <div className="grid grid-cols-7 gap-4">
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                const dateStr = `2022-07-${day.toString().padStart(2, "0")}`
                const eventosDelDia = eventosSimulados.filter((e) => e.fecha === dateStr)
                return (
                  <div key={day} className="min-h-[100px] border rounded p-2 relative">
                    <div className="text-xs text-gray-500 mb-1">{day}</div>
                    {eventosDelDia.map((evento) => (
                      <div
                        key={evento.id}
                        className={`text-xs text-white px-1 py-0.5 mb-1 rounded ${evento.color}`}
                      >
                        {evento.titulo.length > 16 ? evento.titulo.slice(0, 16) + "..." : evento.titulo}
                        <br />
                        <span className="text-[10px]">{evento.hora}</span>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
