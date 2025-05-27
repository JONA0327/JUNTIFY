import { NextResponse } from "next/server"
import { getMySQLPool } from "@/utils/mysql"

export async function GET() {
  try {
    const pool = getMySQLPool()
    const connection = await pool.getConnection()

    try {
      // Check server information
      const [serverRows] = await connection.query("SELECT VERSION() as version")
      const serverInfo = serverRows[0]?.version || "Unknown"

      // Get list of tables and count records
      const [tablesRows] = await connection.query(`
        SHOW TABLES
      `)

      // Get record counts for each table
      const tables = []
      for (const row of tablesRows) {
        const tableName = row[`Tables_in_${process.env.DATABASE_NAME}`]
        const [countRows] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`)
        tables.push({
          table: tableName,
          count: countRows[0].count,
        })
      }

      return NextResponse.json({
        connected: true,
        serverInfo,
        tables,
      })
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error("MySQL connection error:", error)
    return NextResponse.json({
      connected: false,
      error: error.message || "Error connecting to MySQL database",
    })
  }
}
