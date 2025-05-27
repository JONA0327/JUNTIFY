import { query, queryOne } from "@/utils/mysql"
import { v4 as uuidv4 } from "uuid"

export interface Group {
  id: string
  name: string
  description: string
  created_by: string
  created_at: Date
  updated_at: Date
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  role: string
  joined_at: Date
}

export const groupService = {
  // Obtener un grupo por su ID
  async getGroupById(groupId: string): Promise<Group | null> {
    try {
      return await queryOne<Group>("SELECT * FROM `groups` WHERE id = ?", [groupId])
    } catch (error) {
      console.error("Error al obtener grupo por ID:", error)
      return null
    }
  },

  // Obtener todos los grupos
  async getAllGroups(): Promise<Group[]> {
    try {
      return await query<Group>("SELECT * FROM `groups` ORDER BY name")
    } catch (error) {
      console.error("Error al obtener todos los grupos:", error)
      return []
    }
  },

  // Crear un nuevo grupo
  async createGroup(name: string, description: string, createdBy: string): Promise<Group | null> {
    try {
      const groupId = uuidv4()

      await query("INSERT INTO `groups` (id, name, description, created_by) VALUES (?, ?, ?, ?)", [
        groupId,
        name,
        description,
        createdBy,
      ])

      return await this.getGroupById(groupId)
    } catch (error) {
      console.error("Error al crear grupo:", error)
      return null
    }
  },

  // Actualizar un grupo
  async updateGroup(groupId: string, data: Partial<Group>): Promise<Group | null> {
    try {
      const allowedFields = ["name", "description"]
      const updates = Object.keys(data).filter((key) => allowedFields.includes(key))

      if (updates.length === 0) return await this.getGroupById(groupId)

      const setClauses = updates.map((key) => `${key} = ?`).join(", ")
      const values = updates.map((key) => data[key as keyof Partial<Group>])

      await query(`UPDATE \`groups\` SET ${setClauses}, updated_at = NOW() WHERE id = ?`, [...values, groupId])

      return await this.getGroupById(groupId)
    } catch (error) {
      console.error("Error al actualizar grupo:", error)
      return null
    }
  },

  // Eliminar un grupo
  async deleteGroup(groupId: string): Promise<boolean> {
    try {
      const result = await query("DELETE FROM `groups` WHERE id = ?", [groupId])
      return result["affectedRows"] > 0
    } catch (error) {
      console.error("Error al eliminar grupo:", error)
      return false
    }
  },

  // Obtener miembros de un grupo
  async getGroupMembers(groupId: string): Promise<any[]> {
    try {
      return await query(
        `SELECT gm.*, u.username, u.full_name, u.email 
         FROM group_members gm
         JOIN users u ON gm.user_id = u.id
         WHERE gm.group_id = ?
         ORDER BY gm.role, u.full_name`,
        [groupId],
      )
    } catch (error) {
      console.error("Error al obtener miembros del grupo:", error)
      return []
    }
  },

  // Añadir miembro a un grupo
  async addGroupMember(groupId: string, userId: string, role = "member"): Promise<boolean> {
    try {
      // Verificar si ya es miembro
      const existingMember = await queryOne("SELECT * FROM group_members WHERE group_id = ? AND user_id = ?", [
        groupId,
        userId,
      ])

      if (existingMember) {
        // Si ya es miembro, actualizar su rol si es diferente
        if (existingMember.role !== role) {
          await query("UPDATE group_members SET role = ? WHERE group_id = ? AND user_id = ?", [role, groupId, userId])
        }
        return true
      }

      // Si no es miembro, añadirlo
      const memberId = uuidv4()
      await query("INSERT INTO group_members (id, group_id, user_id, role) VALUES (?, ?, ?, ?)", [
        memberId,
        groupId,
        userId,
        role,
      ])

      return true
    } catch (error) {
      console.error("Error al añadir miembro al grupo:", error)
      return false
    }
  },

  // Eliminar miembro de un grupo
  async removeGroupMember(groupId: string, userId: string): Promise<boolean> {
    try {
      const result = await query("DELETE FROM group_members WHERE group_id = ? AND user_id = ?", [groupId, userId])

      return result["affectedRows"] > 0
    } catch (error) {
      console.error("Error al eliminar miembro del grupo:", error)
      return false
    }
  },

  // Cambiar rol de un miembro
  async changeGroupMemberRole(groupId: string, userId: string, newRole: string): Promise<boolean> {
    try {
      const result = await query("UPDATE group_members SET role = ? WHERE group_id = ? AND user_id = ?", [
        newRole,
        groupId,
        userId,
      ])

      return result["affectedRows"] > 0
    } catch (error) {
      console.error("Error al cambiar rol de miembro:", error)
      return false
    }
  },

  // Obtener grupo de un usuario
  async getUserGroup(userId: string): Promise<Group | null> {
    try {
      return await queryOne<Group>(
        `SELECT g.* FROM \`groups\` g
         JOIN group_members gm ON g.id = gm.group_id
         WHERE gm.user_id = ?
         LIMIT 1`,
        [userId],
      )
    } catch (error) {
      console.error("Error al obtener grupo del usuario:", error)
      return null
    }
  },

  // Verificar si un usuario es administrador de un grupo
  async isGroupAdmin(groupId: string, userId: string): Promise<boolean> {
    try {
      const member = await queryOne(
        "SELECT * FROM group_members WHERE group_id = ? AND user_id = ? AND role = 'admin'",
        [groupId, userId],
      )

      return !!member
    } catch (error) {
      console.error("Error al verificar si es administrador:", error)
      return false
    }
  },

  // Generar un nombre aleatorio para un grupo
  generateRandomGroupName(): string {
    const adjectives = [
      "Creativo",
      "Innovador",
      "Dinámico",
      "Brillante",
      "Eficiente",
      "Productivo",
      "Estratégico",
      "Visionario",
      "Colaborativo",
      "Ágil",
    ]

    const nouns = [
      "Equipo",
      "Grupo",
      "Colectivo",
      "Conjunto",
      "Círculo",
      "Alianza",
      "Coalición",
      "Asociación",
      "Comunidad",
      "Red",
    ]

    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)]
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)]

    return `${randomAdjective} ${randomNoun}`
  },
}
