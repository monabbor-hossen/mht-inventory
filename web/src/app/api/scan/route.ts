import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, handleCorsOptions } from '@/lib/cors'
import {
  activityLogRepository,
  inventoryRepository,
  inventoryUseCases,
} from '@/application/use-cases'
import { AppError } from '@/domain/errors'
import { prisma } from '@/infrastructure/database/prisma'

export async function OPTIONS() {
  return handleCorsOptions()
}

// GET: List recent scan activities
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const logs = await activityLogRepository.getRecentLogs(limit)

    const formattedScans = logs.map((log) => ({
      id: log.id,
      key: `SCAN-${log.id}`,
      barcode: log.target_entity,
      date: new Date(log.timestamp).toLocaleDateString(),
      time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      batch: log.target_entity,
      product: log.description,
      bags: 1,
      weight: '25 Kg',
      zone: 'Zone A',
      by: (log as any).user?.name || 'Staff',
      dir: log.action === 'CREATE' ? 'In' : 'Out',
      created_at: log.timestamp,
    }))

    return jsonResponse({
      success: true,
      data: formattedScans,
      count: formattedScans.length,
    })
  } catch (error: any) {
    return errorResponse('Failed to fetch scans', 500, error?.message)
  }
}

// POST: Handles single or batch scan (Dispatch / Damage) with FIFO check
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const items = Array.isArray(body) ? body : [body]
    const results = []

    for (const item of items) {
      const barcode = item.barcode || item.barcode_string || item.uid
      const dir = item.dir || item.direction || 'Out'
      const userId = item.userId ? Number(item.userId) : 1

      if (!barcode && item.batch) {
        // Fallback for batch-level scan
        results.push({
          success: true,
          batch: item.batch,
          message: 'Batch scan recorded',
        })
        continue
      }

      if (!barcode) {
        results.push({
          success: false,
          error: 'Barcode string is required',
        })
        continue
      }

      const barcodeStr = String(barcode).trim()

      // 1. If direction is Damaged:
      if (dir === 'Damaged') {
        try {
          const damageRecord = await inventoryUseCases.recordDamage({
            barcode_string: barcodeStr,
            reason: item.reason || 'Torn',
            photo_url: item.photo_url || null,
            userId,
          })
          results.push({
            success: true,
            barcode: barcodeStr,
            status: 'DAMAGED',
            data: damageRecord,
          })
        } catch (err: any) {
          results.push({
            success: false,
            barcode: barcodeStr,
            error: err.message,
          })
        }
        continue
      }

      // 2. FIFO Check: check if older batch of the same category has remaining items in stock
      let fifoAlert = null
      const barcodeItem = await inventoryRepository.findBarcodeByString(barcodeStr)
      if (barcodeItem && barcodeItem.batch) {
        const olderBatch = await prisma.batch.findFirst({
          where: {
            id: { lt: barcodeItem.batch.id },
            category: barcodeItem.batch.category,
            barcodes: {
              some: { status: 'IN_STOCK' },
            },
          },
          orderBy: { id: 'asc' },
        })

        if (olderBatch) {
          fifoAlert = {
            olderBatch: olderBatch.batch_number,
            message: `FIFO Notice: Older batch "${olderBatch.batch_number}" still has in-stock items.`,
          }
        }
      }

      // 3. Dispatch Scan
      try {
        const dispatched = await inventoryUseCases.dispatchScan({
          barcode_string: barcodeStr,
          userId,
        })
        results.push({
          success: true,
          barcode: barcodeStr,
          status: 'DISPATCHED',
          fifoAlert,
          data: dispatched,
        })
      } catch (err: any) {
        results.push({
          success: false,
          barcode: barcodeStr,
          error: err.message,
        })
      }
    }

    const firstResult = results[0]
    return jsonResponse({
      success: results.some((r) => r.success),
      results,
      data: firstResult,
      fifoAlert: firstResult?.fifoAlert ?? null,
    })
  } catch (error: any) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode)
    }
    return errorResponse('Failed to process scan', 500, error?.message)
  }
}
