import { createClient } from "@supabase/supabase-js"

// Client version (singleton pattern)
let clientInstance: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (clientInstance) return clientInstance

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Missing Supabase environment variables")
  }

  clientInstance = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    },
  })

  return clientInstance
}

// Server version
export function createServerSupabaseClient() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase environment variables for server")
  }

  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: false,
    },
    global: {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    },
  })
}

// User data types
export type UserProfile = {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  team: string | null
  created_at: string
  updated_at: string
}

export type UserOrder = {
  id: number
  user_id: string
  order_id: string
  date: string
  status: string
  total: number
  created_at: string
}

export type UserBillingInfo = {
  id: number
  user_id: string
  name: string
  tax_id: string | null
  address: string | null
  created_at: string
  updated_at: string
}

export type UserAddress = {
  id: number
  user_id: string
  type: string
  address: string
  created_at: string
}
