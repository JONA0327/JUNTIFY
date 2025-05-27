-- Verificar si la columna speaker_map existe en la tabla meetings
SELECT COUNT(*) INTO @columnExists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'meetings' AND COLUMN_NAME = 'speaker_map';

-- Si la columna no existe, crearla
SET @sql = IF(@columnExists = 0, 
              'ALTER TABLE meetings ADD COLUMN speaker_map TEXT NULL',
              'SELECT "La columna speaker_map ya existe"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar si la columna display_speaker existe en la tabla transcriptions
SELECT COUNT(*) INTO @displayColumnExists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'transcriptions' AND COLUMN_NAME = 'display_speaker';

-- Si la columna no existe, crearla
SET @sql2 = IF(@displayColumnExists = 0, 
              'ALTER TABLE transcriptions ADD COLUMN display_speaker VARCHAR(255) NULL',
              'SELECT "La columna display_speaker ya existe"');
PREPARE stmt FROM @sql2;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Inicializar display_speaker con el valor de speaker si está vacío
UPDATE transcriptions SET display_speaker = speaker WHERE display_speaker IS NULL;
