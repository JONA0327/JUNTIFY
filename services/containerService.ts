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

  async getContainerDetails(
    id: number,
    username: string,
  ): Promise<
    Array<{
      id: number
      title: string
      summary: string | null
      keyPoints: string[]
      tasks: any[]
    }>
  > {
    try {
      const meetings = await this.listMeetings(id, username)
      const details = [] as Array<{
        id: number
        title: string
        summary: string | null
        keyPoints: string[]
        tasks: any[]
      }>

      for (const meeting of meetings) {
        const keyPoints = await query(
          "SELECT point_text FROM key_points WHERE meeting_id = ? ORDER BY order_num",
          [meeting.id],
        )
        const tasks = await query(
          "SELECT * FROM tasks WHERE meeting_id = ? ORDER BY priority DESC, due_date ASC",
          [meeting.id],
        )
        details.push({
          id: meeting.id,
          title: meeting.title,
          summary: meeting.summary || null,
          keyPoints: keyPoints.map((k: any) => k.point_text),
          tasks,
        })
      }

      return details
    } catch (error) {
      console.error("Error fetching container details:", error)
      return []
    }
  },
}
