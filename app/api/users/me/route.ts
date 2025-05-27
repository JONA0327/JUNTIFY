import { NextResponse } from "next/server"
import { getUsernameFromRequest } from "@/utils/user-helpers"
import type { NextRequest } from "next/server"
import { createServerSupabaseClient } from "@/utils/supabase"

export async function GET(request: NextRequest) {
  try {
    // Obtener el username del request
    const username = await getUsernameFromRequest(request)

    if (!username) {
      return NextResponse.json({ error: "Unauthorized - Username not provided" }, { status: 401 })
    }

    // Obtener el cliente de Supabase
    const supabase = createServerSupabaseClient()

    // Buscar el usuario por email en Supabase (asumiendo que el username es el email)
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, email, raw_user_meta_data")
      .eq("email", username)
      .single()

    if (userError || !userData) {
      // Si no se encuentra en la base de datos, devolver información básica
      return NextResponse.json({
        id: "temp-id",
        name: username,
        email: username,
        organization: "Default Organization",
      })
    }

    // Extraer información relevante
    const userInfo = {
      id: userData.id,
      email: userData.email,
      name: userData.raw_user_meta_data?.full_name || "",
      organization: userData.raw_user_meta_data?.organization || "",
    }

    return NextResponse.json(userInfo)
  } catch (error) {
    console.error("Error fetching user info:", error)
    return NextResponse.json({ error: "Error fetching user info" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Obtener el username del request
    const username = await getUsernameFromRequest(request)

    if (!username) {
      return NextResponse.json({ error: "Unauthorized - Username not provided" }, { status: 401 })
    }

    // Obtener los datos del cuerpo de la solicitud
    const data = await request.json()
    const { name } = data

    // Aquí normalmente actualizarías los datos en la base de datos
    // Por ahora, simplemente devolvemos los datos actualizados
    return NextResponse.json({
      id: "temp-id",
      name: name || username,
      email: username,
      organization: "Default Organization",
    })
  } catch (error) {
    console.error("Error updating user info:", error)
    return NextResponse.json({ error: "Error updating user info" }, { status: 500 })
  }
}
