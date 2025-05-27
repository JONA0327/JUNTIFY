-- Verificar la estructura actual de la tabla meetings
DESCRIBE meetings;

-- Verificar si existe la columna speaker_map
SELECT COLUMN_NAME, DATA_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'meetings' AND COLUMN_NAME = 'speaker_map';

-- Añadir la columna speaker_map si no existe
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS speaker_map TEXT NULL;

-- Verificar la columna de usuario (supabase_user_id vs user_id)
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'meetings' AND (COLUMN_NAME = 'supabase_user_id' OR COLUMN_NAME = 'user_id');

-- Verificar la relación entre meetings y users
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'users' AND (COLUMN_NAME = 'id' OR COLUMN_NAME = 'supabase_id');
