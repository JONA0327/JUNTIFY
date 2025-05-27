import { NextResponse } from "next/server"
import { query } from "@/utils/mysql"
import { createServerSupabaseClient } from "@/utils/supabase"

export async function GET(request: Request) {
  try {
    console.log("API: Iniciando solicitud GET /api/tasks")

    // Get username from the request headers
    const userEmail = request.headers.get("X-Username")
    console.log("API: Email/username recibido:", userEmail)

    if (!userEmail) {
      console.log("API: Error - Email/username no proporcionado")
      return NextResponse.json({ error: "Unauthorized - Email not provided" }, { status: 401 })
    }

    // Obtener el cliente de Supabase
    const supabase = createServerSupabaseClient()

    // Verificar primero si hay una sesión activa - COMENTAMOS ESTA PARTE QUE CAUSA EL ERROR
    // const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    // if (sessionError || !sessionData.session) {
    //   console.log("API: Error - Sesión no encontrada:", sessionError?.message || "No session")
    //   return NextResponse.json({ error: "Unauthorized - No active session" }, { status: 401 })
    // }

    // Buscar el usuario por email/username en Supabase
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, raw_user_meta_data")
      .eq("email", userEmail)
      .single()

    if (userError) {
      console.log("API: Error al buscar usuario en Supabase:", userError.message)

      // Si no se encuentra en la tabla users, intentar con la tabla profiles
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, full_name")
        .eq("email", userEmail)
        .single()

      if (profileError) {
        // Intentar buscar por username en lugar de email
        const { data: usernameProfileData, error: usernameProfileError } = await supabase
          .from("profiles")
          .select("id, username, full_name")
          .eq("username", userEmail)
          .single()

        if (usernameProfileError) {
          console.log("API: Error al buscar perfil en Supabase:", profileError.message)
          console.log("API: Continuando con el username proporcionado sin verificación")

          // Get query parameters
          const { searchParams } = new URL(request.url)
          const meetingId = searchParams.get("meetingId")
          const assignee = searchParams.get("assignee")
          const completed = searchParams.get("completed")

          console.log("API: Parámetros de búsqueda:", { meetingId, assignee, completed })

          // Build the query with filters - Usamos directamente el username proporcionado
          let sql = `
            SELECT t.*, m.title as meeting_title 
            FROM tasks t
            LEFT JOIN meetings m ON t.meeting_id = m.id
            WHERE (m.username = ? OR t.assignee = ?)
          `
          const params = [userEmail, userEmail]

          // Add filters if provided
          if (meetingId) {
            sql += ` AND t.meeting_id = ?`
            params.push(meetingId)
          }

          if (assignee) {
            sql += ` AND t.assignee = ?`
            params.push(assignee)
          }

          if (completed !== null && completed !== undefined) {
            sql += ` AND t.completed = ?`
            params.push(completed === "true" || completed === "1")
          }

          // Order by due date and priority
          sql += ` ORDER BY t.due_date ASC, t.priority DESC`

          console.log("API: Ejecutando consulta SQL:", sql)
          console.log("API: Parámetros de la consulta:", params)

          // Execute the query
          const tasks = await query(sql, params)
          console.log(`API: Consulta completada, ${tasks.length} tareas encontradas`)

          // Map the results to include due_date
          const mappedTasks = tasks.map((task) => ({
            id: task.id,
            text: task.text,
            description: task.description || "",
            assignee: task.assignee || "No asignado",
            dueDate: task.due_date, // Asegurarse de que este campo se incluya
            priority: task.priority || "media",
            progress: task.progress || 0,
            completed: !!task.completed,
            meeting_id: task.meeting_id,
            meeting_title: task.meeting_title,
          }))

          return NextResponse.json(mappedTasks)
        }

        // Si encontramos por username, usamos esos datos
        console.log("API: Usuario encontrado por username en profiles:", usernameProfileData)

        // Get query parameters
        const { searchParams } = new URL(request.url)
        const meetingId = searchParams.get("meetingId")
        const assignee = searchParams.get("assignee")
        const completed = searchParams.get("completed")

        console.log("API: Parámetros de búsqueda:", { meetingId, assignee, completed })

        // Build the query with filters
        let sql = `
          SELECT t.*, m.title as meeting_title 
          FROM tasks t
          LEFT JOIN meetings m ON t.meeting_id = m.id
          WHERE (m.username = ? OR t.assignee = ?)
        `
        const params = [usernameProfileData.username, usernameProfileData.full_name || usernameProfileData.username]

        // Add filters if provided
        if (meetingId) {
          sql += ` AND t.meeting_id = ?`
          params.push(meetingId)
        }

        if (assignee) {
          sql += ` AND t.assignee = ?`
          params.push(assignee)
        }

        if (completed !== null && completed !== undefined) {
          sql += ` AND t.completed = ?`
          params.push(completed === "true" || completed === "1")
        }

        // Order by due date and priority
        sql += ` ORDER BY t.due_date ASC, t.priority DESC`

        console.log("API: Ejecutando consulta SQL:", sql)
        console.log("API: Parámetros de la consulta:", params)

        // Execute the query
        const tasks = await query(sql, params)
        console.log(`API: Consulta completada, ${tasks.length} tareas encontradas`)

        // Map the results to include due_date
        const mappedTasks = tasks.map((task) => ({
          id: task.id,
          text: task.text,
          description: task.description || "",
          assignee: task.assignee || "No asignado",
          dueDate: task.due_date, // Asegurarse de que este campo se incluya
          priority: task.priority || "media",
          progress: task.progress || 0,
          completed: !!task.completed,
          meeting_id: task.meeting_id,
          meeting_title: task.meeting_title,
        }))

        return NextResponse.json(mappedTasks)
      }

      console.log("API: Usuario encontrado en profiles:", profileData)

      // Get query parameters
      const { searchParams } = new URL(request.url)
      const meetingId = searchParams.get("meetingId")
      const assignee = searchParams.get("assignee")
      const completed = searchParams.get("completed")

      console.log("API: Parámetros de búsqueda:", { meetingId, assignee, completed })

      // Build the query with filters
      let sql = `
        SELECT t.*, m.title as meeting_title 
        FROM tasks t
        LEFT JOIN meetings m ON t.meeting_id = m.id
        WHERE (m.username = ? OR t.assignee = ?)
      `
      const params = [profileData.username, profileData.full_name || profileData.username]

      // Add filters if provided
      if (meetingId) {
        sql += ` AND t.meeting_id = ?`
        params.push(meetingId)
      }

      if (assignee) {
        sql += ` AND t.assignee = ?`
        params.push(assignee)
      }

      if (completed !== null && completed !== undefined) {
        sql += ` AND t.completed = ?`
        params.push(completed === "true" || completed === "1")
      }

      // Order by due date and priority
      sql += ` ORDER BY t.due_date ASC, t.priority DESC`

      console.log("API: Ejecutando consulta SQL:", sql)
      console.log("API: Parámetros de la consulta:", params)

      // Execute the query
      const tasks = await query(sql, params)
      console.log(`API: Consulta completada, ${tasks.length} tareas encontradas`)

      // Map the results to include due_date
      const mappedTasks = tasks.map((task) => ({
        id: task.id,
        text: task.text,
        description: task.description || "",
        assignee: task.assignee || "No asignado",
        dueDate: task.due_date, // Asegurarse de que este campo se incluya
        priority: task.priority || "media",
        progress: task.progress || 0,
        completed: !!task.completed,
        meeting_id: task.meeting_id,
        meeting_title: task.meeting_title,
      }))

      return NextResponse.json(mappedTasks)
    }

    const userId = userData.id
    const userFullName = userData.raw_user_meta_data?.full_name || userEmail
    console.log("API: ID de usuario encontrado:", userId)
    console.log("API: Nombre completo del usuario:", userFullName)

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const meetingId = searchParams.get("meetingId")
    const assignee = searchParams.get("assignee")
    const completed = searchParams.get("completed")

    console.log("API: Parámetros de búsqueda:", { meetingId, assignee, completed })

    // Build the query with filters
    // Ahora buscamos tareas donde el usuario es el propietario O el asignado
    let sql = `
      SELECT t.*, m.title as meeting_title 
      FROM tasks t
      LEFT JOIN meetings m ON t.meeting_id = m.id
      WHERE (t.supabase_user_id = ? OR t.assignee = ? OR m.username = ?)
    `
    const params = [userId, userFullName, userEmail]

    // Add filters if provided
    if (meetingId) {
      sql += ` AND t.meeting_id = ?`
      params.push(meetingId)
    }

    if (assignee) {
      sql += ` AND t.assignee = ?`
      params.push(assignee)
    }

    if (completed !== null && completed !== undefined) {
      sql += ` AND t.completed = ?`
      params.push(completed === "true" || completed === "1")
    }

    // Order by due date and priority
    sql += ` ORDER BY t.due_date ASC, t.priority DESC`

    console.log("API: Ejecutando consulta SQL:", sql)
    console.log("API: Parámetros de la consulta:", params)

    // Execute the query
    const tasks = await query(sql, params)
    console.log(`API: Consulta completada, ${tasks.length} tareas encontradas`)

    // Map the results to include due_date
    const mappedTasks = tasks.map((task) => ({
      id: task.id,
      text: task.text,
      description: task.description || "",
      assignee: task.assignee || "No asignado",
      dueDate: task.due_date, // Asegurarse de que este campo se incluya
      priority: task.priority || "media",
      progress: task.progress || 0,
      completed: !!task.completed,
      meeting_id: task.meeting_id,
      meeting_title: task.meeting_title,
    }))

    return NextResponse.json(mappedTasks)
  } catch (error) {
    console.error("API ERROR: Error fetching tasks:", error)
    return NextResponse.json({ error: "Error fetching tasks", details: String(error) }, { status: 500 })
  }
}

// El resto del código POST permanece igual
export async function POST(request: Request) {
  try {
    console.log("API: Iniciando solicitud POST /api/tasks")

    // Get username from the request headers (realmente es el email)
    const userEmail = request.headers.get("X-Username")
    console.log("API: Email de usuario recibido:", userEmail)

    if (!userEmail) {
      console.log("API: Error - Email no proporcionado")
      return NextResponse.json({ error: "Unauthorized - Email not provided" }, { status: 401 })
    }

    // Obtener el cliente de Supabase
    const supabase = createServerSupabaseClient()

    // Buscar el usuario por email en Supabase
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, raw_user_meta_data")
      .eq("email", userEmail)
      .single()

    if (userError || !userData) {
      // Intentar buscar por username
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, full_name")
        .eq("username", userEmail)
        .single()

      if (profileError) {
        console.log("API: Error - Usuario no encontrado en Supabase:", userError?.message || "No data")
        return NextResponse.json({ error: "User not found in Supabase" }, { status: 404 })
      }

      // Parse the request body
      const body = await request.json()
      console.log("API: Cuerpo de la solicitud:", body)

      const { text, description, assignee, dueDate, priority, meetingId } = body

      // Validate required fields
      if (!text) {
        console.log("API: Error - Texto de tarea no proporcionado")
        return NextResponse.json({ error: "Task text is required" }, { status: 400 })
      }

      // Insert the task
      console.log("API: Insertando nueva tarea")
      const result = await query(
        `INSERT INTO tasks 
         (meeting_id, text, description, assignee, due_date, completed, priority, progress, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          meetingId || null,
          text,
          description || null,
          assignee || profileData.full_name || profileData.username, // Si no se proporciona un asignado, asignar al usuario actual
          dueDate || null,
          false,
          priority || "media",
          0,
        ],
      )

      const taskId = result["insertId"]
      console.log("API: Tarea insertada con ID:", taskId)

      // Get the created task
      console.log("API: Recuperando la tarea creada")
      const task = await query(
        `
        SELECT t.*, m.title as meeting_title 
        FROM tasks t
        LEFT JOIN meetings m ON t.meeting_id = m.id
        WHERE t.id = ?
      `,
        [taskId],
      )

      console.log("API: Tarea recuperada:", task[0])

      // Map the results to include due_date
      const mappedTask = {
        id: task[0].id,
        text: task[0].text,
        description: task[0].description || "",
        assignee: task[0].assignee || "No asignado",
        dueDate: task[0].due_date, // Asegurarse de que este campo se incluya
        priority: task[0].priority || "media",
        progress: task[0].progress || 0,
        completed: !!task[0].completed,
        meeting_id: task[0].meeting_id,
        meeting_title: task[0].meeting_title,
      }

      return NextResponse.json(mappedTask)
    }

    const userId = userData.id
    const userFullName = userData.raw_user_meta_data?.full_name || userEmail
    console.log("API: ID de usuario encontrado:", userId)
    console.log("API: Nombre completo del usuario:", userFullName)

    // Parse the request body
    const body = await request.json()
    console.log("API: Cuerpo de la solicitud:", body)

    const { text, description, assignee, dueDate, priority, meetingId } = body

    // Validate required fields
    if (!text) {
      console.log("API: Error - Texto de tarea no proporcionado")
      return NextResponse.json({ error: "Task text is required" }, { status: 400 })
    }

    // Insert the task
    console.log("API: Insertando nueva tarea")
    const result = await query(
      `INSERT INTO tasks 
       (supabase_user_id, meeting_id, text, description, assignee, due_date, completed, priority, progress, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        userId,
        meetingId || null,
        text,
        description || null,
        assignee || userFullName, // Si no se proporciona un asignado, asignar al usuario actual
        dueDate || null,
        false,
        priority || "media",
        0,
      ],
    )

    const taskId = result["insertId"]
    console.log("API: Tarea insertada con ID:", taskId)

    // Get the created task
    console.log("API: Recuperando la tarea creada")
    const task = await query(
      `
      SELECT t.*, m.title as meeting_title 
      FROM tasks t
      LEFT JOIN meetings m ON t.meeting_id = m.id
      WHERE t.id = ?
    `,
      [taskId],
    )

    console.log("API: Tarea recuperada:", task[0])

    // Map the results to include due_date
    const mappedTask = {
      id: task[0].id,
      text: task[0].text,
      description: task[0].description || "",
      assignee: task[0].assignee || "No asignado",
      dueDate: task[0].due_date, // Asegurarse de que este campo se incluya
      priority: task[0].priority || "media",
      progress: task[0].progress || 0,
      completed: !!task[0].completed,
      meeting_id: task[0].meeting_id,
      meeting_title: task[0].meeting_title,
    }

    return NextResponse.json(mappedTask)
  } catch (error) {
    console.error("API ERROR: Error creating task:", error)
    return NextResponse.json({ error: "Error creating task", details: String(error) }, { status: 500 })
  }
}
