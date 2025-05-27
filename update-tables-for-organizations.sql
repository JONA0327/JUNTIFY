-- Actualizar la tabla de meetings para agregar la columna organization_id si no existe
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS organization_id VARCHAR(36);

-- Actualizar la tabla de tasks para agregar la columna organization_id si no existe
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS organization_id VARCHAR(36);

-- Agregar columna is_admin a la tabla users si no existe
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Agregar columna organization_id a la tabla users si no existe
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id VARCHAR(36);

-- Crear la tabla de organizaciones si no existe
CREATE TABLE IF NOT EXISTS organizations (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Agregar claves foráneas
ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS fk_user_organization 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

ALTER TABLE meetings ADD CONSTRAINT IF NOT EXISTS fk_meeting_organization 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

ALTER TABLE tasks ADD CONSTRAINT IF NOT EXISTS fk_task_organization 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;
