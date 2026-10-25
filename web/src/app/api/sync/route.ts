import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, handleCorsOptions } from '@/lib/cors'
import { offlineSyncUseCase, activityLogRepository } from '@/application/use-cases'
import { DamageReason, ExpenseCategory } from '@/domain/entities'

export async function OPTIONS() {
  return handleCorsOptions()
}

export async function GET() {
  try {
    const logs = await activityLogRepository.getRecentLogs(30)
    return jsonResponse({
      success: true,
      logs: logs.map((l) => ({
        id: l.id,
        recordId: `REC-${l.id}`,
        kind: l.action,
        title: l.target_entity,
        subtitle: l.description,
        syncedBy: (l as any).user?.name || 'Staff',
        syncedAt: l.timestamp,
      })),
      count: logs.length,
    })
  } catch (error: any) {
    return errorResponse('Failed to fetch sync log', 500, error?.message)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const userId = body.userId ? Number(body.userId) : 1

    // Support both format: { items: [...] } or { dispatches, damages, expenses }
    if (Array.isArray(body.items)) {
      const dispatches: Array<{ barcode: string }> = []
      const damages: Array<{ barcode: string; reason: DamageReason; photo_url?: string }> = []
      const expenses: Array<{ category: ExpenseCategory; amount: number; note: string }> = []

      for (const item of body.items) {
        const { kind, data = {} } = item
        if (kind === 'Scan') {
          const barcode = data.barcode || data.uid || data.barcodeUid
          if (barcode) dispatches.push({ barcode })
        } else if (kind === 'Damage') {
          const barcode = data.barcode || data.uid || data.barcodeUid
          if (barcode) {
            damages.push({
              barcode,
              reason: data.reason || 'Torn',
              photo_url: data.photoUrl,
            })
          }
        } else if (kind === 'Expense') {
          expenses.push({
            category: data.category || data.cat || 'Others',
            amount: Number(data.amount || 0),
            note: data.note || 'Offline Expense',
          })
        }
      }

      const syncResult = await offlineSyncUseCase.execute({
        dispatches,
        damages,
        expenses,
        userId,
      })

      return jsonResponse({
        message: 'Sync processed successfully',
        ...syncResult,
      })
    }

    // Direct { dispatches, damages, expenses } payload
    const syncResult = await offlineSyncUseCase.execute({
      dispatches: body.dispatches,
      damages: body.damages,
      expenses: body.expenses,
      userId,
    })

    return jsonResponse({
      message: 'Bulk offline sync processed',
      ...syncResult,
    })
  } catch (error: any) {
    return errorResponse('Failed to execute sync', 500, error?.message)
  }
}
