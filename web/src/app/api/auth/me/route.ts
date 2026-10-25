import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, handleCorsOptions } from '@/lib/cors'
import { verifyToken } from '@/infrastructure/auth/jwt'
import { userRepository } from '@/infrastructure/database/repositories'

export async function OPTIONS() {
  return handleCorsOptions()
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    if (!authHeader) {
      return errorResponse('Missing Authorization header', 401)
    }

    const payload = verifyToken(authHeader)
    if (!payload) {
      return errorResponse('Invalid or expired token', 401)
    }

    const user = await userRepository.findById(payload.userId)
    if (!user) {
      return errorResponse('User account not found', 404)
    }

    return jsonResponse({
      success: true,
      user: {
        id: user.id,
        userId: user.username || String(user.id),
        username: user.username,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error: any) {
    return errorResponse('Failed to verify session', 500, error?.message)
  }
}
