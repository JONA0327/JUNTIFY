import { query, queryOne, type Task, type TaskComment } from "@/utils/mysql"

export const taskService = {
  // Get tasks for a user
  async getTasksByUsername(username: string): Promise<Task[]> {
    try {
      console.log("TaskService: Obteniendo tareas para el usuario:", username)

      // Primero obtenemos el grupo del usuario
      const user = await queryOne("SELECT organization FROM users WHERE username = ?", [username])

      if (!user || !user.organization) {
        console.log("Usuario sin grupo asignado")
        return await query<Task>(
          `
          SELECT t.*, m.title as meeting_title 
          FROM tasks t
          LEFT JOIN meetings m ON t.meeting_id = m.id
          WHERE m.username = ? OR t.assignee = ?
          ORDER BY t.due_date ASC, t.priority DESC
          `,
          [username, username],
        )
      }

      // Si tiene grupo, filtramos por él
      return await query<Task>(
        `
        SELECT t.*, m.title as meeting_title 
        FROM tasks t
        LEFT JOIN meetings m ON t.meeting_id = m.id
        LEFT JOIN users u ON m.username = u.username
        WHERE (m.username = ? OR t.assignee = ?) AND 
              (u.organization = ?)
        ORDER BY t.due_date ASC, t.priority DESC
        `,
        [username, username, user.organization],
      )
    } catch (error) {
      console.error("Error retrieving tasks:", error)
      return []
    }
  },

  // Get tasks for a specific meeting
  async getTasksByMeetingId(meetingId: number): Promise<Task[]> {
    try {
      return await query<Task>(
        `
        SELECT t.*, m.title as meeting_title 
        FROM tasks t
        LEFT JOIN meetings m ON t.meeting_id = m.id
        WHERE t.meeting_id = ? 
        ORDER BY t.due_date ASC, t.priority DESC
      `,
        [meetingId],
      )
    } catch (error) {
      console.error("Error retrieving meeting tasks:", error)
      return []
    }
  },

  // Create a new task
  async createTask(username: string, taskData: Omit<Task, "id" | "created_at" | "updated_at">): Promise<Task | null> {
    try {
      // Obtener el grupo del usuario
      const user = await queryOne("SELECT organization FROM users WHERE username = ?", [username])

      const organization = user?.organization || null

      const result = await query(
        `
        INSERT INTO tasks 
        (meeting_id, text, description, assignee, due_date, completed, priority, progress) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          taskData.meeting_id || null,
          taskData.text,
          taskData.description || null,
          taskData.assignee || null,
          taskData.due_date || null,
          taskData.completed || false,
          taskData.priority || "media",
          taskData.progress || 0,
        ],
      )

      const insertId = result["insertId"]

      return await queryOne<Task>(`SELECT * FROM tasks WHERE id = ?`, [insertId])
    } catch (error) {
      console.error("Error creating task:", error)
      return null
    }
  },

  // Create tasks from meeting analysis
  async createTasksFromMeeting(username: string, meetingId: number, tasks: any[]): Promise<Task[]> {
    try {
      const createdTasks: Task[] = []

      const profiles = await query(
        "SELECT username, full_name FROM users WHERE username IS NOT NULL AND full_name IS NOT NULL",
      )
      const userMap = new Map()
      profiles.forEach((p: any) => {
        userMap.set(p.username.toLowerCase(), p.full_name)
      })

      // Obtener el grupo del usuario
      const user = await queryOne("SELECT organization FROM users WHERE username = ?", [username])
      const organization = user?.organization || null

      // Obtener miembros del grupo si existe
      let groupMembers: any[] = []
      if (organization) {
        groupMembers = await query(
          `SELECT u.username, u.full_name FROM users u
           JOIN group_members gm ON u.id = gm.user_id
           WHERE gm.group_id = ?`,
          [organization],
        )
      }

      for (const task of tasks) {
        // Try to match the assignee with a username from the group first
        let assignee = task.assignee || "No asignado"

        // If we have a match in our group members, use that first
        if (assignee !== "No asignado" && groupMembers.length > 0) {
          const lowerAssignee = assignee.toLowerCase()
          const matchedMember = groupMembers.find(
            (member) =>
              lowerAssignee.includes(member.username.toLowerCase()) ||
              lowerAssignee.includes(member.full_name.toLowerCase()),
          )

          if (matchedMember) {
            assignee = matchedMember.full_name
          } else {
            // If no match in group, try the general userMap
            for (const [username, fullName] of userMap.entries()) {
              if (lowerAssignee.includes(username) || username.includes(lowerAssignee)) {
                assignee = fullName
                break
              }
            }
          }
        }

        // Parse due date if available
        let dueDate = null
        if (task.dueDate && task.dueDate !== "No definida" && task.dueDate !== "No especificada") {
          try {
            // Try to parse the date in various formats
            const dateStr = task.dueDate.trim()
            if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
              dueDate = dateStr // Already in YYYY-MM-DD format
            } else {
              // Try to parse with Date object
              const parsedDate = new Date(dateStr)
              if (!isNaN(parsedDate.getTime())) {
                dueDate = parsedDate.toISOString().split("T")[0]
              }
            }
          } catch (e) {
            console.warn("Could not parse date:", task.dueDate)
          }
        }

        const newTask = await this.createTask(username, {
          meeting_id: meetingId,
          text: task.text,
          description: `Tarea extraída automáticamente de la reunión.`,
          assignee: assignee,
          due_date: dueDate,
          completed: false,
          priority: "media",
          progress: 0,
        })

        if (newTask) {
          createdTasks.push(newTask)
        }
      }

      return createdTasks
    } catch (error) {
      console.error("Error creating tasks from meeting:", error)
      return []
    }
  },

  // Obtener tareas asignadas a un usuario específico
  async getTasksByAssignee(username: string, assignee: string): Promise<Task[]> {
    try {
      // Obtener el grupo del usuario
      const user = await queryOne("SELECT organization FROM users WHERE username = ?", [username])

      if (!user || !user.organization) {
        return await query<Task>(
          `
          SELECT t.*, m.title as meeting_title 
          FROM tasks t
          LEFT JOIN meetings m ON t.meeting_id = m.id
          WHERE m.username = ? AND t.assignee = ? 
          ORDER BY t.due_date ASC, t.priority DESC
          `,
          [username, assignee],
        )
      }

      // Si tiene grupo, filtrar por él
      return await query<Task>(
        `
        SELECT t.*, m.title as meeting_title 
        FROM tasks t
        LEFT JOIN meetings m ON t.meeting_id = m.id
        LEFT JOIN users u ON m.username = u.username
        WHERE u.organization = ? AND t.assignee = ? 
        ORDER BY t.due_date ASC, t.priority DESC
        `,
        [user.organization, assignee],
      )
    } catch (error) {
      console.error("Error retrieving tasks by assignee:", error)
      return []
    }
  },

  // Obtener tareas por estado (completadas o no)
  async getTasksByStatus(username: string, completed: boolean): Promise<Task[]> {
    try {
      // Obtener el grupo del usuario
      const user = await queryOne("SELECT organization FROM users WHERE username = ?", [username])

      if (!user || !user.organization) {
        return await query<Task>(
          `
          SELECT t.*, m.title as meeting_title 
          FROM tasks t
          LEFT JOIN meetings m ON t.meeting_id = m.id
          WHERE m.username = ? AND t.completed = ? 
          ORDER BY t.due_date ASC, t.priority DESC
          `,
          [username, completed],
        )
      }

      // Si tiene grupo, filtrar por él
      return await query<Task>(
        `
        SELECT t.*, m.title as meeting_title 
        FROM tasks t
        LEFT JOIN meetings m ON t.meeting_id = m.id
        LEFT JOIN users u ON m.username = u.username
        WHERE u.organization = ? AND t.completed = ? 
        ORDER BY t.due_date ASC, t.priority DESC
        `,
        [user.organization, completed],
      )
    } catch (error) {
      console.error("Error retrieving tasks by status:", error)
      return []
    }
  },

  // Obtener tareas vencidas
  async getOverdueTasks(username: string): Promise<Task[]> {
    try {
      // Obtener el grupo del usuario
      const user = await queryOne("SELECT organization FROM users WHERE username = ?", [username])

      if (!user || !user.organization) {
        return await query<Task>(
          `
          SELECT t.*, m.title as meeting_title 
          FROM tasks t
          LEFT JOIN meetings m ON t.meeting_id = m.id
          WHERE m.username = ? 
          AND t.completed = false 
          AND t.due_date < CURRENT_DATE
          ORDER BY t.due_date ASC, t.priority DESC
          `,
          [username],
        )
      }

      // Si tiene grupo, filtrar por él
      return await query<Task>(
        `
        SELECT t.*, m.title as meeting_title 
        FROM tasks t
        LEFT JOIN meetings m ON t.meeting_id = m.id
        LEFT JOIN users u ON m.username = u.username
        WHERE u.organization = ? 
        AND t.completed = false 
        AND t.due_date < CURRENT_DATE
        ORDER BY t.due_date ASC, t.priority DESC
        `,
        [user.organization],
      )
    } catch (error) {
      console.error("Error retrieving overdue tasks:", error)
      return []
    }
  },

  // Obtener una tarea por ID
  async getTaskById(taskId: number): Promise<any> {
    try {
      const task = await queryOne(
        `
        SELECT t.*, m.title as meeting_title, m.username
        FROM tasks t
        LEFT JOIN meetings m ON t.meeting_id = m.id
        WHERE t.id = ?
      `,
        [taskId],
      )

      if (!task) return null

      const comments = await query(
        `
        SELECT * FROM task_comments 
        WHERE task_id = ? 
        ORDER BY date DESC
      `,
        [taskId],
      )

      return {
        ...task,
        comments,
      }
    } catch (error) {
      console.error("Error retrieving task by ID:", error)
      return null
    }
  },

  // Update a task
  async updateTask(taskId: number, updates: Partial<Task>): Promise<Task | null> {
    try {
      const allowedFields = [
        "text",
        "description",
        "assignee",
        "due_date",
        "completed",
        "priority",
        "progress",
        "meeting_id",
      ]

      const updateFields = Object.keys(updates).filter((key) => allowedFields.includes(key))

      if (updateFields.length === 0) {
        return await queryOne<Task>(`SELECT * FROM tasks WHERE id = ?`, [taskId])
      }

      const setClauses = updateFields.map((field) => `${field} = ?`).join(", ")
      const params = updateFields.map((field) => updates[field as keyof Task])

      await query(`UPDATE tasks SET ${setClauses} WHERE id = ?`, [...params, taskId])

      return await queryOne<Task>(`SELECT * FROM tasks WHERE id = ?`, [taskId])
    } catch (error) {
      console.error("Error updating task:", error)
      return null
    }
  },

  // Add a comment to a task
  async addTaskComment(
    taskId: number,
    comment: Omit<TaskComment, "id" | "task_id" | "date">,
  ): Promise<TaskComment | null> {
    try {
      const result = await query(`INSERT INTO task_comments (task_id, author, text) VALUES (?, ?, ?)`, [
        taskId,
        comment.author,
        comment.text,
      ])

      const insertId = result["insertId"]

      return await queryOne<TaskComment>(`SELECT * FROM task_comments WHERE id = ?`, [insertId])
    } catch (error) {
      console.error("Error adding task comment:", error)
      return null
    }
  },

  // Get comments for a task
  async getTaskComments(taskId: number): Promise<TaskComment[]> {
    try {
      return await query<TaskComment>(`SELECT * FROM task_comments WHERE task_id = ? ORDER BY date DESC`, [taskId])
    } catch (error) {
      console.error("Error retrieving task comments:", error)
      return []
    }
  },

  // Eliminar una tarea y sus comentarios
  async deleteTask(taskId: number): Promise<boolean> {
    try {
      // Eliminar primero los comentarios asociados
      await query(`DELETE FROM task_comments WHERE task_id = ?`, [taskId])

      // Ahora eliminar la tarea
      const result = await query(`DELETE FROM tasks WHERE id = ?`, [taskId])

      return result["affectedRows"] > 0
    } catch (error) {
      console.error("Error deleting task:", error)
      return false
    }
  },
}
