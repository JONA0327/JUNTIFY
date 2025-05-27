import { createGoogleDriveService } from "@/utils/google-drive-service"

export async function checkGoogleDriveCredentials() {
  console.log("=== DIAGNÓSTICO DE GOOGLE DRIVE ===")

  // 1. Verificar variables de entorno
  console.log("\n1. Variables de entorno:")
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
  const privateKey = process.env.GOOGLE_PRIVATE_KEY
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID

  console.log(`- GOOGLE_CLIENT_EMAIL: ${clientEmail ? "Configurado ✅" : "No configurado ❌"}`)
  console.log(`- GOOGLE_PRIVATE_KEY: ${privateKey ? "Configurado ✅" : "No configurado ❌"}`)
  console.log(`- GOOGLE_DRIVE_FOLDER_ID: ${folderId ? "Configurado ✅" : "No configurado (opcional) ⚠️"}`)

  if (!clientEmail || !privateKey) {
    console.log("\n❌ PROBLEMA: Faltan credenciales esenciales de Google Drive")
    console.log(
      "Solución: Configura las variables de entorno GOOGLE_CLIENT_EMAIL y GOOGLE_PRIVATE_KEY en la configuración de tu proyecto en Vercel",
    )
    return {
      success: false,
      error: "Faltan credenciales esenciales",
      credentialsConfigured: false,
    }
  }

  // 2. Verificar formato de clave privada
  console.log("\n2. Validación de formato:")
  const hasValidFormat = privateKey.includes("BEGIN PRIVATE KEY") && privateKey.includes("END PRIVATE KEY")
  console.log(`- Formato de clave privada: ${hasValidFormat ? "Válido ✅" : "Inválido ❌"}`)

  if (!hasValidFormat) {
    console.log("\n❌ PROBLEMA: El formato de la clave privada no es válido")
    console.log("Solución: Asegúrate de que la clave privada incluya las líneas BEGIN PRIVATE KEY y END PRIVATE KEY")
    return {
      success: false,
      error: "Formato de clave privada inválido",
      credentialsConfigured: false,
    }
  }

  // 3. Probar creación del servicio
  console.log("\n3. Inicialización del servicio:")
  try {
    const driveService = createGoogleDriveService()
    console.log("- Servicio de Google Drive inicializado correctamente ✅")

    // 4. Probar conexión
    console.log("\n4. Prueba de conexión:")
    try {
      const targetFolderId = folderId || "root"
      console.log(`- Intentando listar archivos en carpeta: ${targetFolderId}`)

      const files = await driveService.listFiles(targetFolderId)
      const folderCount = files.filter((file) => file.mimeType === "application/vnd.google-apps.folder").length

      console.log(`- Conexión exitosa ✅ (${files.length} archivos, ${folderCount} carpetas)`)

      return {
        success: true,
        fileCount: files.length,
        folderCount: folderCount,
        credentialsConfigured: true,
      }
    } catch (error) {
      console.error(`- Error al conectar con Google Drive: ${error.message} ❌`)
      console.log("\n❌ PROBLEMA: No se pudo conectar con Google Drive")
      console.log("Posibles causas:")
      console.log("1. La cuenta de servicio no tiene permisos para acceder a la carpeta")
      console.log("2. El ID de carpeta es incorrecto")
      console.log("3. La API de Google Drive no está habilitada para el proyecto")

      return {
        success: false,
        error: "Error de conexión: " + error.message,
        credentialsConfigured: true,
      }
    }
  } catch (error) {
    console.error(`- Error al inicializar servicio: ${error.message} ❌`)
    console.log("\n❌ PROBLEMA: No se pudo inicializar el servicio de Google Drive")
    console.log("Posibles causas:")
    console.log("1. Las credenciales son incorrectas")
    console.log("2. El formato de la clave privada tiene problemas (espacios, saltos de línea)")

    return {
      success: false,
      error: "Error de inicialización: " + error.message,
      credentialsConfigured: false,
    }
  }
}
