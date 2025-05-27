import { NextResponse } from "next/server"
import { getUsernameFromRequest } from "@/utils/user-helpers"
import { query } from "@/utils/mysql"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Obtener el username del request
    const username = await getUsernameFromRequest(request)

    if (!username) {
      return NextResponse.json({ error: "Unauthorized - Username not provided" }, { status: 401 })
    }

    console.log(`Verificando estado de conexión con Google Drive para el usuario ${username}`)

    try {
      // Verificar si la tabla google_tokens existe
      const tables = await query("SHOW TABLES LIKE 'google_tokens'")

      if (tables.length === 0) {
        return NextResponse.json(
          {
            error: "La tabla google_tokens no existe",
            details: "Es necesario crear la tabla google_tokens para usar Google Drive",
            connected: false,
          },
          { status: 200 },
        )
      }
    } catch (tableError) {
      console.error("Error al verificar tabla google_tokens:", tableError)
      return NextResponse.json(
        {
          error: "Error al verificar tabla google_tokens",
          details: String(tableError),
          connected: false,
        },
        { status: 200 },
      )
    }

    // Verificar si el usuario tiene tokens válidos
    const tokensResult = await query(
      "SELECT access_token, refresh_token, expiry_date, recordings_folder_id FROM google_tokens WHERE username = ?",
      [username],
    )

    if (!tokensResult || tokensResult.length === 0) {
      return NextResponse.json({ connected: false })
    }

    const tokenData = tokensResult[0]
    const hasTokens = tokenData.access_token && tokenData.refresh_token
    const recordingsFolderId = tokenData.recordings_folder_id || null

    return NextResponse.json({
      connected: hasTokens,
      recordings_folder_id: recordingsFolderId,
    })
  } catch (error) {
    console.error("Error al verificar estado de Google Drive:", error)
    return NextResponse.json(
      {
        error: "Error al verificar estado de Google Drive",
        details: error.message || "Error desconocido",
        connected: false,
      },
      { status: 200 },
    )
  }
}
