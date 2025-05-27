"use client"
import DualDrivePlayer from "./dual-drive-player"

export default function HardcodedPlayer() {
  // ID del archivo que sabemos que existe (de los logs)
  const fileId = "1GKkJ7xaIQyKh5ZJbUCRZ6rNjW7IaOdrf"

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h2 className="text-xl font-bold mb-4">Reproductor de audio (ID hardcodeado)</h2>
      <DualDrivePlayer fileId={fileId} />
    </div>
  )
}
