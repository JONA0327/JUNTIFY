"use client"

import { useState } from "react"

interface HardcodedAudioPlayerProps {
  fileId: string
}

export default function HardcodedAudioPlayer({
  fileId = "1GKkJ7xaIQyKh5ZJbUCRZ6rNjW7IaOdrf",
}: HardcodedAudioPlayerProps) {
  const [playerType, setPlayerType] = useState<"iframe" | "audio">("iframe")

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 flex space-x-4">
        <button
          onClick={() => setPlayerType("iframe")}
          className={`px-3 py-1 rounded ${
            playerType === "iframe" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300"
          }`}
        >
          Reproductor de Drive
        </button>
        <button
          onClick={() => setPlayerType("audio")}
          className={`px-3 py-1 rounded ${
            playerType === "audio" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300"
          }`}
        >
          Reproductor nativo
        </button>
      </div>

      {playerType === "iframe" ? (
        <iframe
          src={`https://drive.google.com/file/d/${fileId}/preview`}
          width="100%"
          height="80"
          allow="autoplay"
          className="border-0 mb-4"
        ></iframe>
      ) : (
        <audio
          controls
          src={`https://docs.google.com/uc?export=download&id=${fileId}`}
          className="w-full mb-4"
          preload="none"
        >
          Tu navegador no soporta la reproducción de audio.
        </audio>
      )}

      <div className="flex space-x-4">
        <a
          href={`https://docs.google.com/uc?export=download&id=${fileId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline text-sm"
        >
          Descargar audio
        </a>
        <a
          href={`https://drive.google.com/file/d/${fileId}/view`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline text-sm"
        >
          Abrir en Google Drive
        </a>
      </div>
    </div>
  )
}
