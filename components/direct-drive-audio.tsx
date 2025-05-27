"use client"

interface DirectDriveAudioProps {
  fileId: string
}

export default function DirectDriveAudio({ fileId }: DirectDriveAudioProps) {
  return (
    <div className="my-4">
      <audio controls src={`https://docs.google.com/uc?export=download&id=${fileId}`} className="w-full">
        Tu navegador no soporta el elemento de audio.
      </audio>
      <div className="mt-2 text-sm text-gray-500">
        <a
          href={`https://docs.google.com/uc?export=download&id=${fileId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          Descargar audio
        </a>
      </div>
    </div>
  )
}
