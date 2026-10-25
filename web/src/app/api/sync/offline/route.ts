import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, handleCorsOptions } from '@/lib/cors'
import { offlineSyncUseCase } from '@/application/use-cases'

export async function OPTIONS() {
  return handleCorsOptions()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const userId = body.userId ? Number(body.userId) : 1

    const syncResult = await offlineSyncUseCase.execute({
      dispatches: body.dispatches || body.scans,
      damages: body.damages,
      expenses: body.expenses,
      userId,
    })

    return jsonResponse({
      success: true,
      message: 'Mobile offline sync completed successfully',
      data: syncResult,
    })
  } catch (error: any) {
    return errorResponse('Failed to execute offline sync', 500, error?.message)
  }
}
