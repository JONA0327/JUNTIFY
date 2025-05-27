"use client"
import DirectDriveIframe from "./direct-drive-iframe"
import DirectDriveAudio from "./direct-drive-audio"

interface DualDrivePlayerProps {
  fileId: string
}

export default function DualDrivePlayer({ fileId }: DualDrivePlayerProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Reproductor de Google Drive</h3>
        <DirectDriveIframe fileId={fileId} height={80} />
      </div>

      <div>
        <h3 className="text-lg font-medium mb-2">Reproductor de audio nativo</h3>
        <DirectDriveAudio fileId={fileId} />
      </div>
    </div>
  )
}
