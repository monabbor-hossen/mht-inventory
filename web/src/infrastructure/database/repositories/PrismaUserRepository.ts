// ====================================================================
// Infrastructure Layer: Prisma User Repository
// ====================================================================

import { prisma } from '../prisma'
import { IUserRepository } from '@/domain/repositories'
import { Role, UserEntity } from '@/domain/entities'

export class PrismaUserRepository implements IUserRepository {
  private toEntity(record: any): UserEntity {
    return {
      id: record.id,
      username: record.username,
      name: record.name,
      email: record.email,
      role: record.role as Role,
      password_hash: record.password_hash,
      is_active: record.is_active,
      created_at: record.created_at,
      updated_at: record.updated_at,
    }
  }

  async findById(id: number): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({ where: { id } })
    return user ? this.toEntity(user) : null
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({ where: { username } })
    return user ? this.toEntity(user) : null
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({ where: { email } })
    return user ? this.toEntity(user) : null
  }

  async findByIdentifier(identifier: string): Promise<UserEntity | null> {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: identifier },
          { email: identifier },
          { name: identifier },
        ],
      },
    })
    return user ? this.toEntity(user) : null
  }

  async createUser(data: {
    username?: string | null
    name: string
    email?: string | null
    role: Role
    password_hash: string
  }): Promise<UserEntity> {
    const user = await prisma.user.create({
      data: {
        username: data.username,
        name: data.name,
        email: data.email,
        role: data.role,
        password_hash: data.password_hash,
      },
    })
    return this.toEntity(user)
  }

  async findUsers(role?: Role): Promise<UserEntity[]> {
    const where: any = {}
    if (role) where.role = role
    const users = await prisma.user.findMany({
      where,
      orderBy: { name: 'asc' },
    })
    return users.map((u) => this.toEntity(u))
  }
}
