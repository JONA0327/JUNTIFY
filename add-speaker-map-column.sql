-- Verificar si la columna speaker_map existe en la tabla meetings
SET @columnExists = 0;
SELECT COUNT(*) INTO @columnExists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'meetings' 
AND COLUMN_NAME = 'speaker_map';

-- Si la columna no existe, crearla
SET @alterTable = IF(@columnExists = 0, 
                    'ALTER TABLE meetings ADD COLUMN speaker_map JSON DEFAULT NULL', 
                    'SELECT "La columna speaker_map ya existe"');

PREPARE stmt FROM @alterTable;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
