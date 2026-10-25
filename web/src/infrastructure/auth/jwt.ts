// ====================================================================
// Infrastructure Layer: Authentication & JWT Utilities
// ====================================================================

import crypto from 'crypto'
import { Role, UserEntity } from '@/domain/entities'

const JWT_SECRET = process.env.JWT_SECRET || 'mht-inventory-secret-key-warehouse-2026'

export interface TokenPayload {
  userId: number
  username?: string | null
  name: string
  role: Role
  exp: number
}

export function generateToken(user: UserEntity): string {
  const header = { alg: 'HS256', typ: 'JWT' }
  const payload: TokenPayload = {
    userId: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
  }

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url')
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url')

  return `${encodedHeader}.${encodedPayload}.${signature}`
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    if (!token) return null

    // Check if token has Bearer prefix
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token

    // Backward compatibility for legacy tokens: mht_<base64>
    if (cleanToken.startsWith('mht_')) {
      const decoded = Buffer.from(cleanToken.slice(4), 'base64').toString('utf8')
      const [userIdentifier, role] = decoded.split(':')
      return {
        userId: 1,
        username: userIdentifier,
        name: userIdentifier,
        role: (role as Role) || 'STAFF',
        exp: Math.floor(Date.now() / 1000) + 86400,
      }
    }

    const parts = cleanToken.split('.')
    if (parts.length !== 3) return null

    const [headerB64, payloadB64, signature] = parts
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url')

    if (signature !== expectedSignature) return null

    const payload: TokenPayload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf8')
    )

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null // Expired
    }

    return payload
  } catch {
    return null
  }
}
