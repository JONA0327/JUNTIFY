import { type NextRequest, NextResponse } from "next/server"
import { createGoogleDriveService } from "@/utils/google-drive"
import { query } from "@/utils/mysql"

export async function GET(request: NextRequest) {
  console.log("Recibida solicitud de callback de Google")

  // Obtener el código de autorización de los parámetros de la URL
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const state = searchParams.get("state") // El nombre de usuario debería estar aquí

  // Redirigir a la página de perfil con mensaje de error si no hay código
  if (!code) {
    console.error("No se recibió código de autorización:", error || "Desconocido")
    return NextResponse.redirect(
      new URL(`/profile?error=no_code&details=${encodeURIComponent(error || "No se recibió código")}`, request.url),
    )
  }

  try {
    // Obtener el nombre de usuario del estado
    const username = state

    if (!username) {
      console.error("No se encontró nombre de usuario en el estado")
      return NextResponse.redirect(
        new URL(
          `/profile?error=no_user&details=${encodeURIComponent("No se pudo recuperar el nombre de usuario")}`,
          request.url,
        ),
      )
    }

    console.log("Procesando callback para el usuario:", username)

    // Verificar si la tabla google_tokens existe
    try {
      const tables = await query("SHOW TABLES LIKE 'google_tokens'")

      if (tables.length === 0) {
        console.error("La tabla google_tokens no existe")
        return NextResponse.redirect(
          new URL(
            `/profile?error=db_error&details=${encodeURIComponent("Table 'google_tokens' doesn't exist")}`,
            request.url,
          ),
        )
      }
    } catch (tableError) {
      console.error("Error al verificar tabla google_tokens:", tableError)
      return NextResponse.redirect(
        new URL(`/profile?error=db_error&details=${encodeURIComponent(String(tableError))}`, request.url),
      )
    }

    // Crear instancia del servicio de Google Drive
    const googleDriveService = createGoogleDriveService()

    // Obtener tokens con el código de autorización
    let tokens
    try {
      tokens = await googleDriveService.getTokens(code)
      console.log("Tokens obtenidos correctamente")
    } catch (tokenError) {
      console.error("Error al obtener tokens:", tokenError)
      return NextResponse.redirect(
        new URL(`/profile?error=token_error&details=${encodeURIComponent(String(tokenError))}`, request.url),
      )
    }

    // Guardar tokens en la base de datos
    try {
      // Verificar si ya existe un registro para este usuario
      const existingTokens = await query("SELECT id FROM google_tokens WHERE username = ?", [username])

      if (existingTokens.length > 0) {
        // Actualizar tokens existentes
        await query(
          "UPDATE google_tokens SET access_token = ?, refresh_token = ?, expiry_date = ?, updated_at = NOW() WHERE username = ?",
          [tokens.access_token, tokens.refresh_token, new Date(tokens.expiry_date), username],
        )
      } else {
        // Insertar nuevos tokens
        await query(
          "INSERT INTO google_tokens (username, access_token, refresh_token, expiry_date, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())",
          [username, tokens.access_token, tokens.refresh_token, new Date(tokens.expiry_date)],
        )
      }

      console.log("Tokens guardados correctamente en la base de datos")
    } catch (dbError) {
      console.error("Error al guardar tokens en la base de datos:", dbError)
      return NextResponse.redirect(
        new URL(`/profile?error=db_error&details=${encodeURIComponent(String(dbError))}`, request.url),
      )
    }

    // Crear carpeta para grabaciones si no existe
    try {
      // Configurar el cliente con los tokens obtenidos
      googleDriveService.setCredentials(tokens)

      // Verificar si ya tiene una carpeta de grabaciones
      const existingFolder = await query(
        "SELECT recordings_folder_id FROM google_tokens WHERE username = ? AND recordings_folder_id IS NOT NULL",
        [username],
      )

      if (existingFolder.length === 0 || !existingFolder[0].recordings_folder_id) {
        // Crear carpeta para grabaciones
        const folderId = await googleDriveService.createHiddenFolder("Juntify Recordings")

        // Guardar ID de la carpeta en la base de datos
        await query("UPDATE google_tokens SET recordings_folder_id = ? WHERE username = ?", [folderId, username])

        console.log("Carpeta de grabaciones creada con ID:", folderId)
      }
    } catch (folderError) {
      console.error("Error al crear carpeta de grabaciones:", folderError)
      // No redirigimos con error aquí, ya que los tokens se guardaron correctamente
      // Solo registramos el error y continuamos
    }

    // Redirigir a la página de perfil con mensaje de éxito
    return NextResponse.redirect(new URL("/profile?success=connected", request.url))
  } catch (error) {
    console.error("Error en el callback de Google:", error)
    return NextResponse.redirect(
      new URL(`/profile?error=callback_error&details=${encodeURIComponent(String(error))}`, request.url),
    )
  }
}
