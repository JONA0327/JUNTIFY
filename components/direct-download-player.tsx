"use client"

export default function DirectDownloadPlayer() {
  // ID del archivo de audio que sabemos que existe
  const fileId = "1edp0MI5lDrXWogFFO10SGTkBJp1glRa-"

  // URL de descarga directa
  const downloadUrl = `https://docs.google.com/uc?export=download&id=${fileId}`

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-white mb-2">Reproductor de audio directo</h3>
        <audio controls className="w-full" src={downloadUrl}>
          Tu navegador no soporta el elemento de audio.
        </audio>
      </div>

      <div className="flex space-x-4">
        <a
          href={downloadUrl}
          download="98_Prueba_de_Drive.aac"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-block"
        >
          Descargar audio
        </a>

        <a
          href={`https://drive.google.com/file/d/${fileId}/view`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 inline-block"
        >
          Abrir en Google Drive
        </a>
      </div>
    </div>
  )
}
