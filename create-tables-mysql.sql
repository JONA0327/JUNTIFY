-- Drop tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS task_comments;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS meeting_keywords;
DROP TABLE IF EXISTS key_points;
DROP TABLE IF EXISTS transcriptions;
DROP TABLE IF EXISTS meetings;

-- Create the meetings table
CREATE TABLE meetings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  supabase_user_id VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  date DATETIME NOT NULL,
  duration VARCHAR(50),
  participants INT,
  summary TEXT,
  audio_url TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (supabase_user_id),
  INDEX idx_date (date)
);

-- Create the transcriptions table
CREATE TABLE transcriptions (
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
CREATE TABLE key_points (
  id INT AUTO_INCREMENT PRIMARY KEY,
  meeting_id INT NOT NULL,
  point_text TEXT NOT NULL,
  order_num INT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
  INDEX idx_meeting_id (meeting_id)
);

-- Create the meeting_keywords table
CREATE TABLE meeting_keywords (
  id INT AUTO_INCREMENT PRIMARY KEY,
  meeting_id INT NOT NULL,
  keyword VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
  INDEX idx_meeting_id (meeting_id),
  INDEX idx_keyword (keyword)
);

-- Create the tasks table
CREATE TABLE tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  supabase_user_id VARCHAR(255) NOT NULL,
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
  INDEX idx_user_id (supabase_user_id),
  INDEX idx_meeting_id (meeting_id)
);

-- Create the task_comments table
CREATE TABLE task_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  author VARCHAR(255) NOT NULL,
  text TEXT NOT NULL,
  date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  INDEX idx_task_id (task_id)
);
