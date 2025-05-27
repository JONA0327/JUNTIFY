"use client"

export default function IframeOnlyPlayer() {
  // ID del archivo de audio que sabemos que existe
  const fileId = "1edp0MI5lDrXWogFFO10SGTkBJp1glRa-"

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h3 className="text-lg font-medium text-white mb-2">Reproductor de Google Drive</h3>
      <iframe
        src={`https://drive.google.com/file/d/${fileId}/preview`}
        width="100%"
        height="80"
        allow="autoplay"
        style={{ border: "none" }}
      ></iframe>
    </div>
  )
}
