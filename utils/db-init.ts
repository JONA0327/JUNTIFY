import { getMySQLPool } from "./mysql"
import fs from "fs"
import path from "path"

export async function initializeDatabase() {
  try {
    console.log("Initializing database...")

    const pool = getMySQLPool()
    const connection = await pool.getConnection()

    try {
      // Read and execute the SQL schema file
      const schemaPath = path.join(process.cwd(), "create-tables-mysql.sql")
      let schema

      try {
        schema = fs.readFileSync(schemaPath, "utf8")
      } catch (err) {
        console.error("Could not read schema file:", err)
        console.log("Using embedded schema instead")

        schema = `
-- Drop tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS task_comments;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS meeting_keywords;
DROP TABLE IF EXISTS key_points;
DROP TABLE IF EXISTS transcriptions;
DROP TABLE IF EXISTS meetings;

-- Create the meetings table
CREATE TABLE IF NOT EXISTS meetings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  date DATETIME NOT NULL,
  duration VARCHAR(50),
  participants INT,
  summary TEXT,
  audio_url TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_date (date)
);

-- Create the transcriptions table
CREATE TABLE IF NOT EXISTS transcriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  meeting_id INT NOT NULL,
  time VARCHAR(50),
  speaker VARCHAR(255),
  text TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
  INDEX idx_meeting_id (meeting_id)
);

-- Create the key_points table
CREATE TABLE IF NOT EXISTS key_points (
  id INT AUTO_INCREMENT PRIMARY KEY,
  meeting_id INT NOT NULL,
  point_text TEXT NOT NULL,
  order_num INT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
  INDEX idx_meeting_id (meeting_id)
);

-- Create the meeting_keywords table
CREATE TABLE IF NOT EXISTS meeting_keywords (
  id INT AUTO_INCREMENT PRIMARY KEY,
  meeting_id INT NOT NULL,
  keyword VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
  INDEX idx_meeting_id (meeting_id),
  INDEX idx_keyword (keyword)
);

-- Create the tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  meeting_id INT,
  text VARCHAR(255) NOT NULL,
  description TEXT,
  assignee VARCHAR(255),
  due_date DATETIME,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  priority ENUM('baja', 'media', 'alta') NOT NULL DEFAULT 'media',
  progress INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_meeting_id (meeting_id)
);

-- Create the task_comments table
CREATE TABLE IF NOT EXISTS task_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  author VARCHAR(255) NOT NULL,
  text TEXT NOT NULL,
  date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  INDEX idx_task_id (task_id)
);
        `
      }

      // Split the schema into individual statements
      const statements = schema.split(";").filter((statement) => statement.trim().length > 0)

      // Execute each statement
      for (const statement of statements) {
        await connection.query(statement + ";")
      }

      console.log("Database initialized successfully")
      return true
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error("Error initializing database:", error)
    return false
  }
}
