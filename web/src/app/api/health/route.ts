import { testConnection } from '@/lib/db'
import { jsonResponse, handleCorsOptions } from '@/lib/cors'

export async function OPTIONS() {
  return handleCorsOptions()
}

export async function GET() {
  const dbStatus = await testConnection()

  return jsonResponse({
    success: true,
    service: 'MHT Inventory & Ledger MySQL API',
    status: dbStatus.connected ? 'healthy' : 'database_disconnected',
    timestamp: new Date().toISOString(),
    mysql: dbStatus,
  })
}
