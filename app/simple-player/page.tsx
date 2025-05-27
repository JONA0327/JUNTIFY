import SuperSimplePlayer from "@/components/super-simple-player"

export default function SimplePlayerPage() {
  return (
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">Reproductor Super Simple</h1>
        <SuperSimplePlayer />
      </div>
    </div>
  )
}
