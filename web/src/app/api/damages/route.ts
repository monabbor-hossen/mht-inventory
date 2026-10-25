import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, handleCorsOptions } from '@/lib/cors'
import { damageRepository, inventoryUseCases } from '@/application/use-cases'
import { DamageReason } from '@/domain/entities'
import { AppError } from '@/domain/errors'

export async function OPTIONS() {
  return handleCorsOptions()
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const records = await damageRepository.findDamageRecords(limit)

    const formattedDamages = records.map((r) => ({
      id: `DMG-${r.id}`,
      barcode: (r as any).barcode?.barcode_string || 'N/A',
      batch: (r as any).barcode?.batch?.batch_number || 'N/A',
      product: (r as any).barcode?.batch?.category || 'General Bag',
      bags: 1,
      reason: r.reason,
      by: (r as any).user?.name || 'Staff',
      photoUrl: r.photo_url,
      date: new Date(r.created_at).toISOString().split('T')[0],
      time: new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      created_at: r.created_at,
    }))

    return jsonResponse({
      success: true,
      data: formattedDamages,
      totalDamagedBags: formattedDamages.length,
      count: formattedDamages.length,
    })
  } catch (error: any) {
    return errorResponse('Failed to fetch damages', 500, error?.message)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const barcode = body.barcode || body.barcode_string || body.code

    if (!barcode) {
      return errorResponse('Barcode is required to log damage', 400)
    }

    const reason = (body.reason as DamageReason) || 'Torn'
    const photo_url = body.photoUrl || body.photo_url || null
    const userId = body.userId ? Number(body.userId) : 1

    const damageRecord = await inventoryUseCases.recordDamage({
      barcode_string: String(barcode).trim(),
      reason,
      photo_url,
      userId,
    })

    return jsonResponse(
      {
        success: true,
        message: 'Damage record created successfully',
        data: damageRecord,
      },
      201
    )
  } catch (error: any) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode)
    }
    return errorResponse('Failed to record damage', 500, error?.message)
  }
}
