import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/utils/mysql"

export async function POST(request: NextRequest) {
  try {
    const { id, username, full_name, email, organization } = await request.json()

    // Validar que todos los campos requeridos estén presentes
    if (!id || !username || !full_name || !email) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    // Insertar el usuario en la base de datos MySQL
    const sql = `
      INSERT INTO users (id, username, full_name, email, organization)
      VALUES (?, ?, ?, ?, ?)
    `

    await query(sql, [id, username, full_name, email, organization || null])

    return NextResponse.json({ message: "Usuario guardado correctamente en MySQL" }, { status: 201 })
  } catch (error: any) {
    console.error("Error al guardar usuario en MySQL:", error)

    // Verificar si es un error de duplicado
    if (error.message?.includes("Duplicate entry")) {
      if (error.message?.includes("username")) {
        return NextResponse.json({ error: "El nombre de usuario ya existe en MySQL" }, { status: 409 })
      } else if (error.message?.includes("email")) {
        return NextResponse.json({ error: "El correo electrónico ya existe en MySQL" }, { status: 409 })
      }
    }

    return NextResponse.json({ error: "Error al guardar usuario en MySQL" }, { status: 500 })
  }
}

// Endpoint para obtener todos los usuarios (solo para pruebas)
export async function GET() {
  try {
    const users = await query("SELECT * FROM users")
    return NextResponse.json({ users })
  } catch (error) {
    console.error("Error al obtener usuarios:", error)
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 })
  }
}
