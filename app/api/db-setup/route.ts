import { NextResponse } from "next/server"
import { query } from "@/utils/mysql"

export async function POST(request: Request) {
  try {
    // Crear tabla para imágenes de tareas si no existe
    await query(`
      CREATE TABLE IF NOT EXISTS task_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        task_id INT NOT NULL,
        image_url VARCHAR(255) NOT NULL,
        description VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
      )
    `)

    return NextResponse.json({
      success: true,
      message: "Database setup completed successfully",
    })
  } catch (error) {
    console.error("Error setting up database:", error)
    return NextResponse.json(
      {
        error: "Error setting up database",
        details: String(error),
      },
      { status: 500 },
    )
  }
}
