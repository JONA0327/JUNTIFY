import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/utils/mysql"
import fs from "fs"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    // Leer el archivo SQL
    const sqlFilePath = path.join(process.cwd(), "update-tables-for-organizations.sql")
    const sqlContent = fs.readFileSync(sqlFilePath, "utf8")

    // Dividir el contenido en consultas individuales
    const queries = sqlContent
      .split(";")
      .map((q) => q.trim())
      .filter((q) => q.length > 0)

    // Ejecutar cada consulta
    for (const sql of queries) {
      await query(sql)
    }

    return NextResponse.json({ message: "Tablas actualizadas correctamente para organizaciones" })
  } catch (error) {
    console.error("Error al configurar tablas para organizaciones:", error)
    return NextResponse.json({ error: "Error al configurar tablas para organizaciones" }, { status: 500 })
  }
}
