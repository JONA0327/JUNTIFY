"use client"

import { NewNavbar } from "@/components/new-navbar"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import Link from "next/link"
import {
  MessageSquare,
  History,
  UserCog,
  Settings2,
  FileText,
  BarChart,
} from "lucide-react"

export default function AdminPage() {
  const options = [
    { title: "Feedbacks", icon: MessageSquare, available: true, href: "/admin/feedbacks" },
    {
      title: "Cambios de Juntify",
      icon: History,
      available: true,
      href: "/admin/juntify-changes",
    },
    { title: "Administración de usuarios", icon: UserCog, available: false },
    { title: "Administración de analizadores", icon: Settings2, available: false },
    { title: "Políticas y privacidad", icon: FileText, available: false },
    { title: "Estadísticas", icon: BarChart, available: false },
  ]

  return (
    <div className="min-h-screen bg-blue-900">
      <main className="container mx-auto px-4 pb-24 pt-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8 glow-text">Panel de Administración</h1>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {options.map(({ title, icon: Icon, available, href }) => {
              const card = (
                <Card className="bg-blue-800/30 border-blue-700/30 text-white hover:border-blue-500/50">
                  <CardHeader className="flex flex-row items-center space-x-3">
                    <Icon className="h-5 w-5 text-blue-300" />
                    <CardTitle className="text-lg">{title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-blue-300">{available ? "Administrar" : "Próximamente"}</p>
                  </CardContent>
                </Card>
              )
              return available && href ? (
                <Link href={href} key={title} className="block">
                  {card}
                </Link>
              ) : (
                <div key={title}>{card}</div>
              )
            })}
          </div>
        </div>
      </main>
      <NewNavbar />
    </div>
  )
}
