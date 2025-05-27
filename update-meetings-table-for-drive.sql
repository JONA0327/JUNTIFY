-- Actualizar la tabla de reuniones para incluir referencias a Google Drive
ALTER TABLE meetings
ADD COLUMN google_drive_id VARCHAR(255) NULL,
ADD COLUMN google_drive_link VARCHAR(512) NULL;
