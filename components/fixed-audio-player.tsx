"use client"

export default function FixedAudioPlayer() {
  // ID del archivo de audio que sabemos que existe
  const fileId = "1edp0MI5lDrXWogFFO10SGTkBJp1glRa-"

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white mb-2">Reproductor de Google Drive</h3>
        {/* Para reproducir en un iframe, se usa /preview */}
        <iframe
          src={`https://drive.google.com/file/d/${fileId}/preview`}
          width="100%"
          height="80"
          allow="autoplay"
          style={{ border: "none" }}
        ></iframe>
        <div className="mt-2 text-sm text-gray-400">
          {/* Para abrir en Google Drive, se usa /view */}
          <a
            href={`https://drive.google.com/file/d/${fileId}/view`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            Abrir en Google Drive
          </a>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-white mb-2">Reproductor de audio nativo</h3>
        {/* Para descargar directamente, se usa la URL de exportación */}
        <audio controls className="w-full" src={`https://docs.google.com/uc?export=download&id=${fileId}`}>
          Tu navegador no soporta el elemento de audio.
        </audio>
        <div className="mt-2 text-sm text-gray-400">
          <a
            href={`https://docs.google.com/uc?export=download&id=${fileId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            Descargar audio
          </a>
        </div>
      </div>

      <div className="mt-4 p-4 bg-gray-700 rounded-lg">
        <h3 className="text-lg font-medium text-white mb-2">Enlaces directos</h3>
        <div className="space-y-2">
          <p className="text-sm text-gray-300">
            <span className="font-medium">Vista previa:</span>{" "}
            <a
              href={`https://drive.google.com/file/d/${fileId}/preview`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline break-all"
            >
              https://drive.google.com/file/d/{fileId}/preview
            </a>
          </p>
          <p className="text-sm text-gray-300">
            <span className="font-medium">Ver en Drive:</span>{" "}
            <a
              href={`https://drive.google.com/file/d/${fileId}/view`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline break-all"
            >
              https://drive.google.com/file/d/{fileId}/view
            </a>
          </p>
          <p className="text-sm text-gray-300">
            <span className="font-medium">Descargar:</span>{" "}
            <a
              href={`https://docs.google.com/uc?export=download&id=${fileId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline break-all"
            >
              https://docs.google.com/uc?export=download&id={fileId}
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
