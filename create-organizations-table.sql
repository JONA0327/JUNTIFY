-- Tabla de organizaciones
CREATE TABLE IF NOT EXISTS organizations (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Agregar columna organization_id a la tabla users si no existe
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id VARCHAR(36);

-- Agregar clave foránea
ALTER TABLE users ADD CONSTRAINT fk_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

-- Agregar columna is_admin a la tabla users para identificar administradores
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Agregar columna organization_id a la tabla meetings si no existe
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS organization_id VARCHAR(36);

-- Agregar clave foránea para meetings
ALTER TABLE meetings ADD CONSTRAINT fk_meeting_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

-- Agregar columna organization_id a la tabla tasks si no existe
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS organization_id VARCHAR(36);

-- Agregar clave foránea para tasks
ALTER TABLE tasks ADD CONSTRAINT fk_task_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;
