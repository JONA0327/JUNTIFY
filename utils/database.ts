import { createPool } from "@vercel/postgres"
import type { PoolClient } from "@vercel/postgres"

// Crear un pool de conexiones usando @vercel/postgres con configuración optimizada
const pool = createPool({
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  max: 10, // Limitar el número máximo de conexiones
  idleTimeoutMillis: 30000, // Cerrar conexiones inactivas después de 30 segundos
  connectionTimeoutMillis: 5000, // Timeout de conexión de 5 segundos
})

// Función para obtener una conexión del pool
export async function getConnection(): Promise<PoolClient> {
  try {
    return await pool.connect()
  } catch (error) {
    console.error("Error al obtener conexión de la base de datos:", error)
    throw new Error(`Error de conexión a la base de datos: ${error.message}`)
  }
}

// Función para ejecutar una consulta y devolver los resultados
export async function query(text: string, params?: any[]): Promise<any> {
  const client = await pool.connect()
  try {
    const result = await client.query(text, params)
    return result.rows
  } catch (error) {
    console.error("Error en la consulta SQL:", error)
    console.error("Consulta:", text)
    console.error("Parámetros:", params)
    throw new Error(`Error en la consulta SQL: ${error.message}`)
  } finally {
    client.release()
  }
}

// Función para ejecutar una consulta y devolver un solo resultado
export async function queryOne(text: string, params?: any[]): Promise<any> {
  try {
    const result = await query(text, params)
    return result.length > 0 ? result[0] : null
  } catch (error) {
    console.error("Error en queryOne:", error)
    throw error
  }
}

// Función para ejecutar una transacción
export async function transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    const result = await callback(client)
    await client.query("COMMIT")
    return result
  } catch (error) {
    await client.query("ROLLBACK")
    console.error("Error en la transacción:", error)
    throw error
  } finally {
    client.release()
  }
}

// Tipos para las entidades principales
export type Meeting = {
  id: number
  user_id: string
  title: string
  date: Date
  duration?: string
  participants?: number
  summary?: string
  audio_url?: string
  created_at: Date
  updated_at: Date
}

export type Transcription = {
  id: number
  meeting_id: number
  time?: string
  speaker?: string
  text: string
  created_at: Date
}

export type KeyPoint = {
  id: number
  meeting_id: number
  point_text: string
  order_num?: number
  created_at: Date
}

export type Task = {
  id: number
  user_id: string
  meeting_id?: number
  text: string
  description?: string
  assignee?: string
  due_date?: Date
  completed: boolean
  priority: "baja" | "media" | "alta"
  progress: number
  created_at: Date
  updated_at: Date
}

export type TaskComment = {
  id: number
  task_id: number
  author: string
  text: string
  date: Date
}

export type MeetingKeyword = {
  id: number
  meeting_id: number
  keyword: string
  created_at: Date
}
