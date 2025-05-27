import { query, queryOne } from "@/utils/mysql"
import { v4 as uuidv4 } from "uuid"

// Generar un código aleatorio para la organización
function generateOrganizationCode(length = 8): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

// Generar un nombre aleatorio para la organización
function generateOrganizationName(): string {
  const adjectives = [
    "Creativo",
    "Innovador",
    "Dinámico",
    "Brillante",
    "Eficiente",
    "Ágil",
    "Moderno",
    "Visionario",
    "Estratégico",
    "Global",
  ]

  const nouns = [
    "Equipo",
    "Grupo",
    "Colectivo",
    "Conjunto",
    "Organización",
    "Asociación",
    "Alianza",
    "Comunidad",
    "Red",
    "Círculo",
  ]

  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)]

  return `${randomAdjective} ${randomNoun}`
}

export const organizationService = {
  // Crear una nueva organización
  async createOrganization(name = ""): Promise<any> {
    try {
      const orgName = name.trim() || generateOrganizationName()
      const orgId = uuidv4()
      const orgCode = generateOrganizationCode()

      await query(`INSERT INTO organizations (id, name, code) VALUES (?, ?, ?)`, [orgId, orgName, orgCode])

      return {
        id: orgId,
        name: orgName,
        code: orgCode,
      }
    } catch (error) {
      console.error("Error al crear organización:", error)
      throw error
    }
  },

  // Obtener una organización por su código
  async getOrganizationByCode(code: string): Promise<any> {
    try {
      return await queryOne(`SELECT * FROM organizations WHERE code = ?`, [code])
    } catch (error) {
      console.error("Error al obtener organización por código:", error)
      return null
    }
  },

  // Obtener una organización por su ID
  async getOrganizationById(id: string): Promise<any> {
    try {
      return await queryOne(`SELECT * FROM organizations WHERE id = ?`, [id])
    } catch (error) {
      console.error("Error al obtener organización por ID:", error)
      return null
    }
  },

  // Asignar un usuario a una organización
  async assignUserToOrganization(userId: string, organizationId: string, isAdmin = false): Promise<boolean> {
    try {
      await query(`UPDATE users SET organization_id = ?, is_admin = ? WHERE id = ?`, [organizationId, isAdmin, userId])
      return true
    } catch (error) {
      console.error("Error al asignar usuario a organización:", error)
      return false
    }
  },

  // Obtener miembros de una organización
  async getOrganizationMembers(organizationId: string): Promise<any[]> {
    try {
      return await query(`SELECT id, username, full_name, email, is_admin FROM users WHERE organization_id = ?`, [
        organizationId,
      ])
    } catch (error) {
      console.error("Error al obtener miembros de la organización:", error)
      return []
    }
  },

  // Verificar si un usuario es administrador de una organización
  async isUserAdmin(userId: string, organizationId: string): Promise<boolean> {
    try {
      const result = await queryOne(`SELECT is_admin FROM users WHERE id = ? AND organization_id = ?`, [
        userId,
        organizationId,
      ])
      return result && result.is_admin === true
    } catch (error) {
      console.error("Error al verificar si el usuario es administrador:", error)
      return false
    }
  },

  // Obtener la organización de un usuario
  async getUserOrganization(userId: string): Promise<any> {
    try {
      const user = await queryOne(`SELECT organization_id FROM users WHERE id = ?`, [userId])

      if (!user || !user.organization_id) return null

      return await this.getOrganizationById(user.organization_id)
    } catch (error) {
      console.error("Error al obtener la organización del usuario:", error)
      return null
    }
  },

  // Eliminar un usuario de una organización
  async removeUserFromOrganization(userId: string): Promise<boolean> {
    try {
      await query(`UPDATE users SET organization_id = NULL, is_admin = false WHERE id = ?`, [userId])
      return true
    } catch (error) {
      console.error("Error al eliminar usuario de la organización:", error)
      return false
    }
  },

  // Actualizar el nombre de una organización
  async updateOrganizationName(organizationId: string, name: string): Promise<boolean> {
    try {
      await query(`UPDATE organizations SET name = ? WHERE id = ?`, [name, organizationId])
      return true
    } catch (error) {
      console.error("Error al actualizar nombre de la organización:", error)
      return false
    }
  },

  // Disolver una organización (eliminar todos los miembros)
  async dissolveOrganization(organizationId: string): Promise<boolean> {
    try {
      // Primero desvinculamos a todos los miembros
      await query(`UPDATE users SET organization_id = NULL, is_admin = false WHERE organization_id = ?`, [
        organizationId,
      ])

      // Luego eliminamos la organización
      await query(`DELETE FROM organizations WHERE id = ?`, [organizationId])

      return true
    } catch (error) {
      console.error("Error al disolver la organización:", error)
      return false
    }
  },
}
