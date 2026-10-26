// ====================================================================
// Presentation Layer: NextAuth Route Handler
// ====================================================================

import NextAuth from 'next-auth'
import { authOptions } from '@/infrastructure/auth/nextauth'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
