// Updated meeting service using MySQL and username
import { query, queryOne, type Meeting, type Transcription, type KeyPoint, type MeetingKeyword } from "@/utils/mysql"

// Service for handling meetings and related data
export const meetingService = {
  // Create a new meeting with transcription and key points
  async createMeeting(
    username: string,
    data: {
      title: string
      date: Date
      duration?: string
      participants?: number
      summary?: string
      audio_url?: string
      transcription?: Array<{
        time?: string
        speaker?: string
        text: string
      }>
      keyPoints?: string[]
      keywords?: string[]
    },
  ): Promise<Meeting> {
    try {
      console.log("Starting creation of meeting for username:", username)
      console.log(
        "Meeting data:",
        JSON.stringify({
          ...data,
          transcription: data.transcription ? `${data.transcription.length} items` : "none",
        }),
      )

      // Obtener el ID de la organización del usuario
      const user = await queryOne("SELECT organization_id FROM users WHERE username = ?", [username])

      const organizationId = user?.organization_id || null

      // Obtener el recordings_folder_id del usuario si está configurado
      const folderRes = await query(
        "SELECT recordings_folder_id FROM google_tokens WHERE username = ? AND recordings_folder_id IS NOT NULL",
        [username],
      )
      const recordingsFolderId =
        folderRes.length > 0 ? folderRes[0].recordings_folder_id : null

      // Insert the meeting
      const result = await query(
        `INSERT INTO meetings
        (username, title, date, duration, participants, summary, audio_url, organization_id, recordings_folder_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          username,
          data.title,
          data.date,
          data.duration || null,
          data.participants || null,
          data.summary || null,
          data.audio_url || null,
          organizationId,
          recordingsFolderId,
        ],
      )

      // Get the inserted ID
      const insertId = result.insertId
      console.log("Meeting created with ID:", insertId)

      // Get the created meeting
      const meeting = await queryOne<Meeting>(`SELECT * FROM meetings WHERE id = ?`, [insertId])

      if (!meeting) {
        throw new Error("Failed to retrieve created meeting")
      }

      // Asegurar que el objeto de la reunión refleje el recordings_folder_id almacenado
      ;(meeting as any).recordings_folder_id = recordingsFolderId

      // Si hay transcripción, insertarla
      if (data.transcription && data.transcription.length > 0) {
        console.log(`Inserting ${data.transcription.length} transcription elements`)

        // Insert in batches to avoid too large queries
        const batchSize = 50
        for (let i = 0; i < data.transcription.length; i += batchSize) {
          const batch = data.transcription.slice(i, i + batchSize)

          // Create batch insert
          const placeholders = batch.map(() => "(?, ?, ?, ?, NOW())").join(", ")
          const params: any[] = []

          batch.forEach((item) => {
            params.push(insertId, item.time || null, item.speaker || null, item.text)
          })

          await query(
            `INSERT INTO transcriptions 
            (meeting_id, time, speaker, text, created_at) 
            VALUES ${placeholders}`,
            params,
          )
        }
      }

      // Si hay puntos clave, insertarlos
      if (data.keyPoints && data.keyPoints.length > 0) {
        console.log(`Inserting ${data.keyPoints.length} key points`)

        const placeholders = data.keyPoints.map(() => "(?, ?, ?, NOW())").join(", ")
        const params: any[] = []

        data.keyPoints.forEach((point, index) => {
          params.push(insertId, point, index + 1)
        })

        await query(
          `INSERT INTO key_points 
          (meeting_id, point_text, order_num, created_at) 
          VALUES ${placeholders}`,
          params,
        )
      }

      // Si hay palabras clave, insertarlas
      if (data.keywords && data.keywords.length > 0) {
        console.log(`Inserting ${data.keywords.length} keywords`)

        const placeholders = data.keywords.map(() => "(?, ?, NOW())").join(", ")
        const params: any[] = []

        data.keywords.forEach((keyword) => {
          params.push(insertId, keyword)
        })

        await query(
          `INSERT INTO meeting_keywords 
          (meeting_id, keyword, created_at) 
          VALUES ${placeholders}`,
          params,
        )
      }

      console.log("Meeting creation process completed successfully")
      return meeting
    } catch (error) {
      console.error("Detailed error creating meeting:", error)
      throw new Error(`Couldn't create meeting: ${error.message}`)
    }
  },

  // Get all meetings for a user by username
  async getMeetingsByUsername(username: string): Promise<Meeting[]> {
    try {
      // Obtener el ID de la organización del usuario
      const user = await queryOne("SELECT organization_id FROM users WHERE username = ?", [username])

      if (!user || !user.organization_id) {
        // Si no tiene organización, solo mostrar sus propias reuniones
        return await query<Meeting>("SELECT * FROM meetings WHERE username = ? ORDER BY date DESC", [username])
      }

      // Si tiene organización, mostrar todas las reuniones de la organización
      return await query<Meeting>(
        `SELECT m.* FROM meetings m
         JOIN users u ON m.username = u.username
         WHERE u.organization_id = ?
         ORDER BY m.date DESC`,
        [user.organization_id],
      )
    } catch (error) {
      console.error("Error getting meetings by username:", error)
      return []
    }
  },

  // Get a meeting by ID with all its related data
  async getMeetingById(meetingId: number, username: string): Promise<any> {
    try {
      console.log(`Fetching meeting with ID ${meetingId} for username ${username}`)

      // Obtener la reunión principal
      const meeting = await queryOne<Meeting>("SELECT * FROM meetings WHERE id = ? AND username = ?", [
        meetingId,
        username,
      ])

      if (!meeting) {
        console.log(`No meeting found with ID ${meetingId} for username ${username}`)
        return null
      }

      console.log(`Found meeting: ${meeting.title}`)

      // Obtener la transcripción
      console.log(`Fetching transcription for meeting ${meetingId}`)
      const transcription = await query<Transcription>(
        "SELECT * FROM transcriptions WHERE meeting_id = ? ORDER BY id",
        [meetingId],
      )
      console.log(`Found ${transcription.length} transcription entries`)

      // Obtener los puntos clave
      console.log(`Fetching key points for meeting ${meetingId}`)
      const keyPoints = await query<KeyPoint>("SELECT * FROM key_points WHERE meeting_id = ? ORDER BY order_num", [
        meetingId,
      ])
      console.log(`Found ${keyPoints.length} key points`)

      // Obtener las palabras clave
      console.log(`Fetching keywords for meeting ${meetingId}`)
      const keywords = await query<MeetingKeyword>("SELECT * FROM meeting_keywords WHERE meeting_id = ?", [meetingId])
      console.log(`Found ${keywords.length} keywords`)

      // Obtener las tareas relacionadas
      console.log(`Fetching tasks for meeting ${meetingId}`)
      const tasks = await query("SELECT * FROM tasks WHERE meeting_id = ? ORDER BY priority DESC, due_date ASC", [
        meetingId,
      ])
      console.log(`Found ${tasks.length} tasks`)

      // Construir y devolver el objeto completo
      return {
        ...meeting,
        transcription: transcription || [],
        keyPoints: keyPoints || [],
        keywords: keywords.map((k) => k.keyword) || [],
        tasks: tasks || [],
      }
    } catch (error) {
      console.error("Error detallado al obtener reunión por ID:", error)
      throw new Error(`Error al obtener reunión: ${error.message}`)
    }
  },

  // Get transcription for a meeting
  async getTranscription(meetingId: number): Promise<Transcription[]> {
    try {
      return await query<Transcription>(`SELECT * FROM transcriptions WHERE meeting_id = ? ORDER BY id ASC`, [
        meetingId,
      ])
    } catch (error) {
      console.error("Error getting transcription:", error)
      return []
    }
  },

  // Get key points for a meeting
  async getKeyPoints(meetingId: number): Promise<KeyPoint[]> {
    try {
      return await query<KeyPoint>(`SELECT * FROM key_points WHERE meeting_id = ? ORDER BY order_num ASC`, [meetingId])
    } catch (error) {
      console.error("Error getting key points:", error)
      return []
    }
  },

  // Get keywords for a meeting
  async getKeywords(meetingId: number): Promise<MeetingKeyword[]> {
    try {
      return await query<MeetingKeyword>(`SELECT * FROM meeting_keywords WHERE meeting_id = ?`, [meetingId])
    } catch (error) {
      console.error("Error getting keywords:", error)
      return []
    }
  },

  // Search meetings by search term
  async searchMeetings(username: string, searchTerm: string): Promise<Meeting[]> {
    try {
      return await query<Meeting>(
        `SELECT DISTINCT m.* FROM meetings m
         LEFT JOIN transcriptions t ON m.id = t.meeting_id
         WHERE m.username = ? 
         AND (
           m.title LIKE ? 
           OR m.summary LIKE ? 
           OR t.text LIKE ?
         )
         ORDER BY m.date DESC`,
        [username, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`],
      )
    } catch (error) {
      console.error("Error searching meetings:", error)
      return []
    }
  },

  // Filter meetings by date
  async filterMeetingsByDate(username: string, startDate: Date, endDate: Date): Promise<Meeting[]> {
    try {
      return await query<Meeting>(
        `SELECT * FROM meetings 
         WHERE username = ? 
         AND date BETWEEN ? AND ?
         ORDER BY date DESC`,
        [username, startDate, endDate],
      )
    } catch (error) {
      console.error("Error filtering meetings by date:", error)
      return []
    }
  },

  // Filter meetings by keywords
  async filterMeetingsByKeywords(username: string, keywords: string[]): Promise<Meeting[]> {
    try {
      if (!keywords.length) return this.getMeetingsByUsername(username)

      const placeholders = keywords.map(() => "?").join(", ")

      return await query<Meeting>(
        `SELECT DISTINCT m.* FROM meetings m
         JOIN meeting_keywords k ON m.id = k.meeting_id
         WHERE m.username = ?
         AND k.keyword IN (${placeholders})
         ORDER BY m.date DESC`,
        [username, ...keywords],
      )
    } catch (error) {
      console.error("Error filtering meetings by keywords:", error)
      return []
    }
  },

  // Update a meeting
  async updateMeeting(meetingId: number, username: string, updateData: Partial<Meeting>): Promise<Meeting | null> {
    try {
      const allowedFields = ["title", "date", "duration", "participants", "summary", "audio_url"]
      const updates = Object.keys(updateData).filter((key) => allowedFields.includes(key))

      if (updates.length === 0) return null

      const setClauses = updates.map((key) => `${key} = ?`).join(", ")
      const values = updates.map((key) => updateData[key as keyof Partial<Meeting>])

      await query(
        `UPDATE meetings 
         SET ${setClauses}
         WHERE id = ? AND username = ?`,
        [...values, meetingId, username],
      )

      return await queryOne<Meeting>(`SELECT * FROM meetings WHERE id = ? AND username = ?`, [meetingId, username])
    } catch (error) {
      console.error("Error updating meeting:", error)
      return null
    }
  },

  // Delete a meeting and all its related data
  async deleteMeeting(meetingId: number, username: string): Promise<boolean> {
    try {
      // Due to foreign key constraints with ON DELETE CASCADE,
      // we only need to delete the meeting record
      const result = await query("DELETE FROM meetings WHERE id = ? AND username = ?", [meetingId, username])

      return result["affectedRows"] > 0
    } catch (error) {
      console.error("Error deleting meeting:", error)
      return false
    }
  },
}
