import { query, queryOne } from "@/utils/mysql"

export interface JuntifyChange {
  id: number
  version: string
  description: string
  change_date: string
  change_time: string
  created_at: Date
  updated_at: Date
}

export const juntifyChangesService = {
  async getAll(): Promise<JuntifyChange[]> {
    try {
      return await query<JuntifyChange>(
        "SELECT * FROM juntify_changes ORDER BY change_date DESC, change_time DESC"
      )
    } catch (error) {
      console.error("Error fetching juntify changes:", error)
      return []
    }
  },

  async createChange(version: string, description: string): Promise<JuntifyChange | null> {
    try {
      const result = await query(
        "INSERT INTO juntify_changes (version, description, change_date, change_time) VALUES (?, ?, CURDATE(), CURTIME())",
        [version, description]
      )
      const insertId = result.insertId
      return await queryOne<JuntifyChange>("SELECT * FROM juntify_changes WHERE id = ?", [insertId])
    } catch (error) {
      console.error("Error creating juntify change:", error)
      return null
    }
  },

  async updateChange(id: number, version: string, description: string): Promise<JuntifyChange | null> {
    try {
      await query(
        "UPDATE juntify_changes SET version = ?, description = ? WHERE id = ?",
        [version, description, id]
      )
      return await queryOne<JuntifyChange>("SELECT * FROM juntify_changes WHERE id = ?", [id])
    } catch (error) {
      console.error("Error updating juntify change:", error)
      return null
    }
  },

  async deleteChange(id: number): Promise<boolean> {
    try {
      const result = await query("DELETE FROM juntify_changes WHERE id = ?", [id])
      return result.affectedRows > 0
    } catch (error) {
      console.error("Error deleting juntify change:", error)
      return false
    }
  },
}
