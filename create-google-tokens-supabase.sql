-- Crear tabla para tokens de Google Drive en Supabase
CREATE TABLE IF NOT EXISTS google_tokens (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  username TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
  recordings_folder_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(username)
);

-- Crear políticas de seguridad para la tabla
CREATE POLICY "Usuarios pueden ver sus propios tokens"
  ON google_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar sus propios tokens"
  ON google_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propios tokens"
  ON google_tokens
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propios tokens"
  ON google_tokens
  FOR DELETE
  USING (auth.uid() = user_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE google_tokens ENABLE ROW LEVEL SECURITY;
