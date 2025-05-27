import StandaloneAudioPlayer from "@/components/standalone-audio-player"

export default function AudioPlayerPage() {
  return (
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">Reproductor de Audio</h1>
        <StandaloneAudioPlayer />
      </div>
    </div>
  )
}
