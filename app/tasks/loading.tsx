import { Loader } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen bg-blue-900 flex items-center justify-center">
      <div className="text-center">
        <Loader className="h-10 w-10 text-blue-400 animate-spin mx-auto mb-4" />
        <p className="text-xl text-white">Cargando tareas...</p>
      </div>
    </div>
  )
}
