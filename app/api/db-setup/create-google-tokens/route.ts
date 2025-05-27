import { NextResponse } from "next/server"
import { query } from "@/utils/mysql"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    console.log("Iniciando creación de tabla google_tokens")

    // Leer el script SQL del archivo
    const sqlFilePath = path.join(process.cwd(), "create-google-tokens-table.sql")
    let sqlScript: string

    try {
      sqlScript = fs.readFileSync(sqlFilePath, "utf8")
      console.log("Script SQL leído correctamente")
    } catch (readError) {
      console.error("Error al leer el archivo SQL:", readError)

      // Si no se puede leer el archivo, usar el script directamente
      console.log("Usando script SQL hardcodeado")
      sqlScript = `
        CREATE TABLE IF NOT EXISTS google_tokens (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(255) NOT NULL,
          access_token TEXT NOT NULL,
          refresh_token TEXT NOT NULL,
          expiry_date DATETIME NOT NULL,
          recordings_folder_id VARCHAR(255),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_username (username)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `
    }

    // Ejecutar el script SQL
    await query(sqlScript)
    console.log("Script SQL ejecutado correctamente")

    // Verificar que la tabla se haya creado correctamente
    const tables = await query("SHOW TABLES LIKE 'google_tokens'")

    if (tables.length === 0) {
      console.error("La tabla google_tokens no se creó correctamente")
      return NextResponse.json({ error: "La tabla google_tokens no se creó correctamente" }, { status: 500 })
    }

    console.log("Tabla google_tokens creada correctamente")
    return NextResponse.json({ success: true, message: "Tabla google_tokens creada correctamente" })
  } catch (error) {
    console.error("Error al crear tabla google_tokens:", error)
    return NextResponse.json({ error: "Error al crear tabla google_tokens", details: String(error) }, { status: 500 })
  }
}
