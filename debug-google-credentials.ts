// Este script te ayudará a verificar si tus credenciales de Google Drive están configuradas correctamente
// Puedes ejecutarlo en tu entorno de desarrollo para diagnosticar problemas

import { google } from "googleapis"

// Función para verificar las credenciales de Google Drive
async function checkGoogleDriveCredentials() {
  console.log("=== Verificación de Credenciales de Google Drive ===")

  // Verificar variables de entorno
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
  const privateKey = process.env.GOOGLE_PRIVATE_KEY
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID

  console.log("\n1. Verificando variables de entorno:")
  console.log(`- GOOGLE_CLIENT_EMAIL: ${clientEmail ? "✅ Configurado" : "❌ No configurado"}`)
  console.log(`- GOOGLE_PRIVATE_KEY: ${privateKey ? "✅ Configurado" : "❌ No configurado"}`)
  console.log(`- GOOGLE_DRIVE_FOLDER_ID: ${folderId ? "✅ Configurado" : "⚠️ Opcional, no configurado"}`)

  if (!clientEmail || !privateKey) {
    console.error("\n❌ ERROR: Faltan variables de entorno esenciales.")
    console.log("\nPara solucionar este problema:")
    console.log("1. Verifica que las variables de entorno estén configuradas en tu archivo .env")
    console.log("2. Asegúrate de que las variables estén disponibles en tu entorno de producción")
    console.log("3. Reinicia tu servidor después de configurar las variables")
    return
  }

  // Verificar formato de la clave privada
  console.log("\n2. Verificando formato de la clave privada:")

  const formattedKey = privateKey.replace(/\\n/g, "\n")
  const hasCorrectHeader = formattedKey.includes("-----BEGIN PRIVATE KEY-----")
  const hasCorrectFooter = formattedKey.includes("-----END PRIVATE KEY-----")

  console.log(`- Contiene encabezado correcto: ${hasCorrectHeader ? "✅ Sí" : "❌ No"}`)
  console.log(`- Contiene pie correcto: ${hasCorrectFooter ? "✅ Sí" : "❌ No"}`)

  if (!hasCorrectHeader || !hasCorrectFooter) {
    console.error("\n❌ ERROR: El formato de la clave privada es incorrecto.")
    console.log("\nPara solucionar este problema:")
    console.log(
      "1. Asegúrate de que la clave privada incluya '-----BEGIN PRIVATE KEY-----' y '-----END PRIVATE KEY-----'",
    )
    console.log("2. Verifica que los saltos de línea se manejen correctamente (\\n)")
    console.log("3. La clave debe estar en formato base64")
    return
  }

  // Intentar crear un cliente de autenticación
  console.log("\n3. Intentando crear cliente de autenticación:")

  try {
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: formattedKey,
      scopes: ["https://www.googleapis.com/auth/drive"],
    })

    console.log("✅ Cliente de autenticación creado correctamente")

    // Intentar inicializar el cliente de Drive
    console.log("\n4. Intentando inicializar cliente de Google Drive:")

    const drive = google.drive({ version: "v3", auth })
    console.log("✅ Cliente de Google Drive inicializado correctamente")

    // Intentar listar archivos para verificar la conexión
    console.log("\n5. Intentando listar archivos (prueba de conexión):")

    try {
      const response = await drive.files.list({
        pageSize: 5,
        fields: "files(id, name)",
      })

      console.log(`✅ Conexión exitosa. Se encontraron ${response.data.files.length} archivos.`)
      console.log("\n✅ VERIFICACIÓN COMPLETA: Las credenciales de Google Drive están configuradas correctamente.")
    } catch (error) {
      console.error("❌ Error al listar archivos:", error.message)
      console.log("\n⚠️ Las credenciales parecen válidas pero hay un problema al acceder a Google Drive.")
      console.log("Posibles causas:")
      console.log("1. La cuenta de servicio no tiene permisos suficientes")
      console.log("2. La API de Google Drive no está habilitada en tu proyecto de Google Cloud")
      console.log("3. Hay restricciones de dominio en tu organización")
    }
  } catch (error) {
    console.error("❌ Error al crear cliente de autenticación:", error.message)
    console.log("\n❌ VERIFICACIÓN FALLIDA: No se pudo inicializar el cliente con las credenciales proporcionadas.")
  }
}

// Ejecutar la verificación
checkGoogleDriveCredentials().catch(console.error)
