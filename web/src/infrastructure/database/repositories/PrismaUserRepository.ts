// ====================================================================
// Infrastructure Layer: Prisma User Repository
// ====================================================================

import { prisma } from '../prisma'
import { IUserRepository } from '@/domain/repositories'
import { UserEntity } from '@/domain/entities'

export class PrismaUserRepository implements IUserRepository {
  async findById(id: number): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    })
    if (!user) return null
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      password_hash: user.password_hash,
      created_at: user.created_at,
      updated_at: user.updated_at,
    }
  }

  async findByName(name: string): Promise<UserEntity | null> {
    const user = await prisma.user.findFirst({
      where: { name },
    })
    if (!user) return null
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      password_hash: user.password_hash,
      created_at: user.created_at,
      updated_at: user.updated_at,
    }
  }

  async findByIdentifier(identifier: string): Promise<UserEntity | null> {
    const trimmed = identifier.trim()
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: trimmed },
          { name: trimmed },
          { name: { contains: trimmed } },
        ],
      },
    })
    if (!user) return null
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      password_hash: user.password_hash,
      created_at: user.created_at,
      updated_at: user.updated_at,
    }
  }

  async createUser(data: {
    username?: string | null
    name: string
    role: 'ADMIN' | 'MANAGER' | 'STAFF'
    password_hash: string
  }): Promise<UserEntity> {
    const user = await prisma.user.create({
      data: {
        username: data.username,
        name: data.name,
        role: data.role,
        password_hash: data.password_hash,
      },
    })
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      password_hash: user.password_hash,
      created_at: user.created_at,
      updated_at: user.updated_at,
    }
  }
}
