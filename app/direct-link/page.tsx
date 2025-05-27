import DirectLinkPlayer from "@/components/direct-link-player"

export default function DirectLinkPage() {
  return (
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">Enlace Directo</h1>
        <DirectLinkPlayer />
      </div>
    </div>
  )
}
