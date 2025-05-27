-- Verificar si la columna speaker_map existe en la tabla meetings
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'meetings' 
AND COLUMN_NAME = 'speaker_map';

-- Verificar si la columna display_speaker existe en la tabla transcriptions
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'transcriptions' 
AND COLUMN_NAME = 'display_speaker';
