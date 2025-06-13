import { query, queryOne, type Notification } from "@/utils/mysql"

export const notificationService = {
  async getNotifications(username: string): Promise<Notification[]> {
    try {
      return await query<Notification>(
        "SELECT * FROM notifications WHERE username = ? ORDER BY created_at DESC",
        [username],
      )
    } catch (error) {
      console.error("Error retrieving notifications:", error)
      return []
    }
  },

  async createNotification(
    username: string,
    message: string,
  ): Promise<Notification | null> {
    try {
      const result = await query(
        "INSERT INTO notifications (username, message) VALUES (?, ?)",
        [username, message],
      )
      const insertId = result["insertId"]
      return await queryOne<Notification>(
        "SELECT * FROM notifications WHERE id = ?",
        [insertId],
      )
    } catch (error) {
      console.error("Error creating notification:", error)
      return null
    }
  },

  async markAsRead(id: number): Promise<boolean> {
    try {
      const result = await query(
        "UPDATE notifications SET `read` = TRUE WHERE id = ?",
        [id],
      )
      return result.affectedRows > 0
    } catch (error) {
      console.error("Error marking notification as read:", error)
      return false
    }
  },

  async deleteNotification(id: number): Promise<boolean> {
    try {
      const result = await query("DELETE FROM notifications WHERE id = ?", [id])
      return result.affectedRows > 0
    } catch (error) {
      console.error("Error deleting notification:", error)
      return false
    }
  },
}
