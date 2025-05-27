"use client"

export default function DirectLinkPlayer() {
  // ID del archivo de audio que sabemos que existe
  const fileId = "1edp0MI5lDrXWogFFO10SGTkBJp1glRa-"
  const downloadUrl = `https://docs.google.com/uc?export=download&id=${fileId}`

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h3 className="text-lg font-medium text-white mb-2">Enlace Directo</h3>
      <p className="text-white mb-4">Haz clic en el siguiente enlace para descargar el audio directamente:</p>
      <a
        href={downloadUrl}
        download
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-block"
      >
        Descargar Audio
      </a>
    </div>
  )
}
