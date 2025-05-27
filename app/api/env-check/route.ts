import { NextResponse } from "next/server"

export async function GET() {
  // NOTA: Nunca expongas valores completos de variables sensibles en producción
  // Este endpoint es solo para diagnóstico durante el desarrollo
  return NextResponse.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID
      ? "Configurado (comienza con " + process.env.GOOGLE_CLIENT_ID.substring(0, 5) + "...)"
      : "No configurado",
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ? "Configurado" : "No configurado",
    googleRedirectUri: process.env.GOOGLE_REDIRECT_URI || "No configurado",
    googleApiKey: process.env.GOOGLE_API_KEY
      ? "Configurado (comienza con " + process.env.GOOGLE_API_KEY.substring(0, 5) + "...)"
      : "No configurado",
  })
}
