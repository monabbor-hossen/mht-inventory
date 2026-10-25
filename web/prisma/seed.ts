// ====================================================================
// Database Seed Script (Prisma)
// Initial Admin, Manager & Staff user accounts for MHT Inventory
// ====================================================================

import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding MHT Inventory database...')

  const defaultPassword = 'password123'
  const passwordHash = await bcrypt.hash(defaultPassword, 10)

  // 1. Seed Users
  const admin = await prisma.user.upsert({
    where: { id: 1 },
    update: {
      username: 'admin',
      name: 'Mahmudul H. (Admin)',
      role: Role.ADMIN,
      password_hash: passwordHash,
    },
    create: {
      username: 'admin',
      name: 'Mahmudul H. (Admin)',
      role: Role.ADMIN,
      password_hash: passwordHash,
    },
  })

  const manager = await prisma.user.upsert({
    where: { id: 2 },
    update: {
      username: 'manager',
      name: 'Kamal H. (Manager)',
      role: Role.MANAGER,
      password_hash: passwordHash,
    },
    create: {
      username: 'manager',
      name: 'Kamal H. (Manager)',
      role: Role.MANAGER,
      password_hash: passwordHash,
    },
  })

  const staff = await prisma.user.upsert({
    where: { id: 3 },
    update: {
      username: 'staff',
      name: 'Rafiqul I. (Staff)',
      role: Role.STAFF,
      password_hash: passwordHash,
    },
    create: {
      username: 'staff',
      name: 'Rafiqul I. (Staff)',
      role: Role.STAFF,
      password_hash: passwordHash,
    },
  })

  console.log('✅ Users created:', { admin: admin.name, manager: manager.name, staff: staff.name })
  console.log('🔑 Default password for all seeded accounts is: "password123"')
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
