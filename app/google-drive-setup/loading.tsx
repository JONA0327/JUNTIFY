export default function Loading() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <h2 className="text-xl font-semibold text-blue-300">Cargando configuración de Google Drive...</h2>
        <p className="text-blue-200 mt-2">Por favor espera mientras preparamos la página de configuración.</p>
      </div>
    </div>
  )
}
