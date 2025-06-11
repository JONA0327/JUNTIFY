-- Create table for user's meeting containers
CREATE TABLE meeting_containers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username)
);

-- Table linking containers with meetings (many-to-many)
CREATE TABLE container_meetings (
  container_id INT NOT NULL,
  meeting_id INT NOT NULL,
  PRIMARY KEY (container_id, meeting_id),
  FOREIGN KEY (container_id) REFERENCES meeting_containers(id) ON DELETE CASCADE,
  FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
  INDEX idx_meeting_id (meeting_id)
);
