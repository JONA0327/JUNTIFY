import { NextResponse } from "next/server"

export async function POST() {
  const response = NextResponse.json({ ok: true }, { status: 200 })
  // Clear auth_token cookie
  response.cookies.set("auth_token", "", { path: "/", maxAge: 0 })
  return response
}

export const dynamic = "force-dynamic"
