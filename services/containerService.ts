import { query, queryOne } from "@/utils/mysql"

export interface MeetingContainer {
  id: number
  username: string
  name: string
  created_at: Date
  updated_at: Date
}

export const containerService = {
  async getContainers(username: string): Promise<MeetingContainer[]> {
    try {
      return await query<MeetingContainer>(
        "SELECT * FROM meeting_containers WHERE username = ? ORDER BY created_at DESC",
        [username],
      )
    } catch (error) {
      console.error("Error fetching containers:", error)
      return []
    }
  },

  async getContainerById(id: number, username: string): Promise<MeetingContainer | null> {
    try {
      return await queryOne<MeetingContainer>(
        "SELECT * FROM meeting_containers WHERE id = ? AND username = ?",
        [id, username],
      )
    } catch (error) {
      console.error("Error fetching container by id:", error)
      return null
    }
  },

  async createContainer(username: string, name: string): Promise<MeetingContainer | null> {
    try {
      const result = await query(
        "INSERT INTO meeting_containers (username, name) VALUES (?, ?)",
        [username, name],
      )
      const insertId = result.insertId
      return await this.getContainerById(insertId, username)
    } catch (error) {
      console.error("Error creating container:", error)
      return null
    }
  },

  async renameContainer(id: number, username: string, name: string): Promise<MeetingContainer | null> {
    try {
      await query(
        "UPDATE meeting_containers SET name = ? WHERE id = ? AND username = ?",
        [name, id, username],
      )
      return await this.getContainerById(id, username)
    } catch (error) {
      console.error("Error renaming container:", error)
      return null
    }
  },

  async deleteContainer(id: number, username: string): Promise<boolean> {
    try {
      const result = await query(
        "DELETE FROM meeting_containers WHERE id = ? AND username = ?",
        [id, username],
      )
      return result["affectedRows"] > 0
    } catch (error) {
      console.error("Error deleting container:", error)
      return false
    }
  },

  async listMeetings(id: number, username: string): Promise<any[]> {
    try {
      return await query(
        `SELECT m.* FROM container_meetings cm
         JOIN meetings m ON cm.meeting_id = m.id
         WHERE cm.container_id = ? AND m.username = ?
         ORDER BY m.date DESC`,
        [id, username],
      )
    } catch (error) {
      console.error("Error listing container meetings:", error)
      return []
    }
  },

  async addMeeting(id: number, meetingId: number, username: string): Promise<boolean> {
    try {
      const container = await this.getContainerById(id, username)
      if (!container) return false
      await query(
        "INSERT IGNORE INTO container_meetings (container_id, meeting_id) VALUES (?, ?)",
        [id, meetingId],
      )
      return true
    } catch (error) {
      console.error("Error adding meeting to container:", error)
      return false
    }
  },

  async removeMeeting(id: number, meetingId: number, username: string): Promise<boolean> {
    try {
      const container = await this.getContainerById(id, username)
      if (!container) return false
      const result = await query(
        "DELETE FROM container_meetings WHERE container_id = ? AND meeting_id = ?",
        [id, meetingId],
      )
      return result["affectedRows"] > 0
    } catch (error) {
      console.error("Error removing meeting from container:", error)
      return false
    }
  },


  async getContainerDetails(id: number, username: string): Promise<any | null> {
    try {
      const container = await this.getContainerById(id, username)
      if (!container) return null

      const summaries = await query(
        `SELECT m.id as meeting_id, m.title, m.summary
         FROM container_meetings cm
         JOIN meetings m ON cm.meeting_id = m.id
         WHERE cm.container_id = ? AND m.username = ?
         ORDER BY m.date DESC`,
        [id, username],
      )

      const keyPoints = await query(
        `SELECT kp.id, kp.meeting_id, kp.point_text, m.title as meeting_title
         FROM key_points kp
         JOIN meetings m ON kp.meeting_id = m.id
         JOIN container_meetings cm ON cm.meeting_id = kp.meeting_id
         WHERE cm.container_id = ? AND m.username = ?
         ORDER BY kp.order_num`,
        [id, username],
      )

      const tasks = await query(
        `SELECT t.id, t.text as title, t.description, t.assignee, t.due_date, t.completed, t.priority, t.progress,
                t.meeting_id, m.title as meeting_title
         FROM tasks t
         JOIN meetings m ON t.meeting_id = m.id
         JOIN container_meetings cm ON cm.meeting_id = t.meeting_id
         WHERE cm.container_id = ? AND m.username = ?
         ORDER BY t.due_date ASC, t.priority DESC`,
        [id, username],
      )

      return { summaries, keyPoints, tasks }
    } catch (error) {
      console.error("Error fetching container details:", error)
      return null

    }
  },
}
