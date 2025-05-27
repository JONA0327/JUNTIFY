import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/utils/supabase"

export async function GET(request: Request) {
  try {
    // Get username from the request headers
    const username = request.headers.get("X-Username")

    if (!username) {
      return NextResponse.json({ error: "Unauthorized - Username not provided" }, { status: 401 })
    }

    // Get organization members from Supabase
    const supabase = createServerSupabaseClient()
    const { data: profiles, error } = await supabase.from("profiles").select("username, full_name, avatar_url")

    if (error) {
      console.error("Error fetching profiles:", error)
      return NextResponse.json({ error: "Error fetching organization members" }, { status: 500 })
    }

    // Filter out profiles without username or full_name
    const members = profiles
      .filter((profile) => profile.username && profile.full_name)
      .map((profile) => ({
        username: profile.username,
        fullName: profile.full_name,
        avatarUrl: profile.avatar_url,
      }))

    return NextResponse.json(members)
  } catch (error) {
    console.error("Error fetching organization members:", error)
    return NextResponse.json({ error: "Error fetching organization members" }, { status: 500 })
  }
}
