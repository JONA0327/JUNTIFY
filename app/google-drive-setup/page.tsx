import { Suspense } from "react"
import { GoogleDriveCredentials } from "@/components/google-drive-credentials"
import { GoogleDriveSetup } from "@/components/google-drive-setup"

// Componente de carga para el Suspense
function Loading() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      <span className="ml-2 text-blue-300">Cargando...</span>
    </div>
  )
}

export default function GoogleDriveSetupPage() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-center text-white">Configuración de Google Drive</h1>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold mb-4 text-blue-300">1. Configurar credenciales</h2>
          <p className="text-blue-200 mb-4">
            Configura las credenciales de la cuenta de servicio de Google Drive para habilitar el almacenamiento de
            archivos.
          </p>
          <Suspense fallback={<Loading />}>
            <GoogleDriveCredentials />
          </Suspense>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4 text-blue-300">2. Conectar tu cuenta</h2>
          <p className="text-blue-200 mb-4">
            Una vez configuradas las credenciales, conecta tu cuenta de usuario para empezar a guardar archivos.
          </p>
          <Suspense fallback={<Loading />}>
            <GoogleDriveSetup />
          </Suspense>
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-900/30 rounded-lg">
        <h2 className="text-xl font-semibold mb-2 text-blue-300">Documentación</h2>
        <div className="text-blue-200 space-y-2">
          <p>Para configurar correctamente Google Drive, necesitas:</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Crear un proyecto en Google Cloud Console</li>
            <li>Habilitar la API de Google Drive</li>
            <li>Crear una cuenta de servicio</li>
            <li>Generar una clave privada para la cuenta de servicio</li>
            <li>Configurar las credenciales en esta página</li>
          </ol>
          <p className="mt-2">
            Para instrucciones detalladas, consulta la{" "}
            <a href="#" className="text-blue-400 underline">
              documentación
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
