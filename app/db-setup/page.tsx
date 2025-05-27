import { DbSetupButton } from "@/components/db-setup-button"

export default function DbSetupPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6 text-white">Configuración de Base de Datos</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-blue-800/30 border border-blue-700/30 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Tabla Google Tokens</h2>
          <p className="text-blue-300 mb-4">
            Esta tabla almacena los tokens de autenticación para la integración con Google Drive.
          </p>
          <DbSetupButton
            tableName="google_tokens"
            setupEndpoint="/api/db-setup/create-google-tokens"
            buttonText="Crear tabla Google Tokens"
            successMessage="Tabla Google Tokens creada correctamente"
          />
        </div>

        {/* Puedes añadir más secciones para otras tablas aquí */}
      </div>

      <div className="mt-8 text-center">
        <a href="/profile" className="text-blue-400 hover:text-blue-300 underline">
          Volver al perfil
        </a>
      </div>
    </div>
  )
}
