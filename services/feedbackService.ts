import { query } from "@/utils/mysql"

export interface Feedback {
  id: number
  username: string | null
  message: string
  created_at: Date
}

export const feedbackService = {
  async getAll(): Promise<Feedback[]> {
    try {
      return await query<Feedback>(
        "SELECT id, username, message, created_at FROM feedback ORDER BY created_at DESC"
      )
    } catch (error) {
      console.error("Error fetching feedbacks:", error)
      return []
    }
  },

  async deleteFeedback(id: number): Promise<boolean> {
    try {
      const result = await query("DELETE FROM feedback WHERE id = ?", [id])
      return result.affectedRows > 0
    } catch (error) {
      console.error("Error deleting feedback:", error)
      return false
    }
  },
}
