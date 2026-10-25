import { jsonResponse, errorResponse, handleCorsOptions } from '@/lib/cors'
import { prisma } from '@/infrastructure/database/prisma'

export async function OPTIONS() {
  return handleCorsOptions()
}

export async function GET() {
  try {
    const userCount = await prisma.user.count()
    const batchCount = await prisma.batch.count()
    const barcodeCount = await prisma.barcodeItem.count()
    const expenseCount = await prisma.expense.count()

    return jsonResponse({
      success: true,
      message: 'Database is initialized and synchronized with Prisma',
      stats: {
        users: userCount,
        batches: batchCount,
        barcodes: barcodeCount,
        expenses: expenseCount,
      },
    })
  } catch (error: any) {
    return errorResponse('Database health check failed', 500, error?.message)
  }
}

export async function POST() {
  return GET()
}
