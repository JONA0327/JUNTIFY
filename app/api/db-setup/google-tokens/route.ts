import { NextResponse } from "next/server"
import { query } from "@/utils/mysql"
import fs from "fs"
import path from "path"

export async function GET(request: Request) {
  try {
    // Leer el archivo SQL
    const sqlFilePath = path.join(process.cwd(), "create-google-tokens-table.sql")
    let sql: string

    try {
      sql = fs.readFileSync(sqlFilePath, "utf8")
    } catch (error) {
      // Si no se puede leer el archivo, usar la consulta directamente
      sql = `
        CREATE TABLE IF NOT EXISTS google_tokens (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(255) NOT NULL,
          access_token TEXT NOT NULL,
          refresh_token TEXT,
          expiry_date DATETIME NOT NULL,
          recordings_folder_id VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_username (username)
        );
      `
    }

    // Ejecutar la consulta SQL
    await query(sql)

    return NextResponse.json({ success: true, message: "Tabla google_tokens creada correctamente" })
  } catch (error) {
    console.error("Error al crear la tabla google_tokens:", error)
    return NextResponse.json(
      { error: "Error al crear la tabla google_tokens", details: String(error) },
      { status: 500 },
    )
  }
}
