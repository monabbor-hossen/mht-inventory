import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { jsonResponse, errorResponse, handleCorsOptions } from '@/lib/cors'
import { prisma } from '@/infrastructure/database/prisma'
import { Role } from '@prisma/client'

export async function OPTIONS() {
  return handleCorsOptions()
}

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        created_at: true,
        updated_at: true,
      },
    })

    return jsonResponse({
      success: true,
      users: users.map((u) => ({
        id: u.id,
        userId: u.username || String(u.id),
        username: u.username,
        name: u.name,
        role: u.role,
        status: 'Active',
        created_at: u.created_at,
      })),
      total: users.length,
    })
  } catch (error: any) {
    return errorResponse('Failed to fetch users', 500, error?.message)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, username, name, role = 'STAFF', password } = body

    const finalUsername = (username || userId || '').trim()
    const finalName = (name || finalUsername).trim()

    if (!finalUsername || !password) {
      return errorResponse('Missing required fields: username and password', 400)
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const validRole = (['ADMIN', 'MANAGER', 'STAFF'].includes(String(role).toUpperCase())
      ? String(role).toUpperCase()
      : 'STAFF') as Role

    const user = await prisma.user.create({
      data: {
        username: finalUsername,
        name: finalName,
        role: validRole,
        password_hash: hashedPassword,
      },
    })

    return jsonResponse(
      {
        success: true,
        message: 'User created successfully',
        user: {
          id: user.id,
          username: user.username,
          userId: user.username,
          name: user.name,
          role: user.role,
        },
      },
      201
    )
  } catch (error: any) {
    return errorResponse('Failed to create user', 500, error?.message)
  }
}
