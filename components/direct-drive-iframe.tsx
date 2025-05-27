"use client"

interface DirectDriveIframeProps {
  fileId: string
  width?: string | number
  height?: string | number
}

export default function DirectDriveIframe({ fileId, width = "100%", height = 80 }: DirectDriveIframeProps) {
  return (
    <div className="my-4">
      <iframe
        src={`https://drive.google.com/file/d/${fileId}/preview`}
        width={width}
        height={height}
        allow="autoplay"
        style={{ border: "none" }}
      ></iframe>
      <div className="mt-2 text-sm text-gray-500">
        <a
          href={`https://drive.google.com/file/d/${fileId}/view`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          Abrir en Google Drive
        </a>
      </div>
    </div>
  )
}
