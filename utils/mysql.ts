import mysql from "mysql2/promise"

// Configuración de la conexión a la base de datos
const dbConfig = {
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  port: process.env.DATABASE_PORT ? Number.parseInt(process.env.DATABASE_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
}

// Pool de conexiones para reutilizar conexiones. En entornos serverless es
// posible que el módulo se cargue varias veces, por lo que guardamos el pool
// en la instancia global para evitar crear nuevos pools en cada invocación.
let pool: mysql.Pool

export const getMySQLPool = (): mysql.Pool => {
  if (!pool) {
    // Reutilizar pool si ya existe en el ámbito global
    pool = (global as any).mysqlPool
    if (!pool) {
      pool = mysql.createPool(dbConfig)
      ;(global as any).mysqlPool = pool
      console.log("Pool de conexiones MySQL creado")
    }
  }
  return pool
}

// Función para cerrar el pool de conexiones manualmente en casos donde se
// necesite liberar todos los recursos, por ejemplo al cerrar la aplicación.
export const closeMySQLPool = async (): Promise<void> => {
  if (pool) {
    await pool.end()
    ;(global as any).mysqlPool = undefined
    pool = undefined as unknown as mysql.Pool
  }
}

// Función para obtener una conexión del pool
export const getConnection = async (): Promise<mysql.PoolConnection> => {
  try {
    const pool = await getMySQLPool()
    return await pool.getConnection()
  } catch (error) {
    console.error("Error al obtener conexión MySQL:", error)
    throw error
  }
}

// Función para ejecutar consultas SQL
export const query = async (sql: string, params: any[] = []): Promise<any> => {
  let connection
  try {
    connection = await getConnection()
    console.log(`Ejecutando consulta: ${sql}`)
    console.log(`Parámetros: ${JSON.stringify(params)}`)

    const [results] = await connection.execute(sql, params)
    return results
  } catch (error) {
    console.error(`Error en consulta SQL: ${sql}`, error)
    throw error
  } finally {
    if (connection) {
      connection.release()
    }
  }
}

// Función para ejecutar una consulta y devolver un solo resultado
export const queryOne = async (sql: string, params: any[] = []): Promise<any> => {
  try {
    const results = await query(sql, params)
    return results.length > 0 ? results[0] : null
  } catch (error) {
    console.error(`Error en consulta SQL: ${sql}`, error)
    throw error
  }
}

// Tipos para las entidades principales
export type Meeting = {
  id: number
  supabase_user_id: string
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

export type MeetingKeyword = {
  id: number
  meeting_id: number
  keyword: string
  created_at: Date
}

export type Task = {
  id: number
  supabase_user_id: string
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
