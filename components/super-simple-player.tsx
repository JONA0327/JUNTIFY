"use client"

export default function SuperSimplePlayer() {
  // ID del archivo de audio que sabemos que existe
  const fileId = "1edp0MI5lDrXWogFFO10SGTkBJp1glRa-"

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h3 className="text-lg font-medium text-white mb-2">Reproductor Super Simple</h3>
      <audio controls className="w-full" src={`https://docs.google.com/uc?export=download&id=${fileId}`}>
        Tu navegador no soporta el elemento de audio.
      </audio>
    </div>
  )
}
