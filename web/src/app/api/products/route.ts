// ====================================================================
// Presentation Layer: Products Master API Route
// ====================================================================

import { NextRequest, NextResponse } from 'next/server'
import { container } from '@/infrastructure/container'
import { handleApiError } from '@/presentation/errors/handleError'
import { handleCorsOptions, jsonResponse } from '@/lib/cors'

export async function OPTIONS() {
  return handleCorsOptions()
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || undefined
    const query = searchParams.get('query') || undefined

    const products = await container.productUseCases.listProducts({ category, query })
    return jsonResponse({ success: true, data: products })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const product = await container.productUseCases.createProduct({
      sku: body.sku,
      name: body.name,
      category: body.category,
      unit_weight: Number(body.unit_weight),
      unit_of_measure: body.unit_of_measure ?? 'kg',
      description: body.description,
      min_stock_alert: body.min_stock_alert ? Number(body.min_stock_alert) : 10,
    }, body.user_id ? Number(body.user_id) : undefined)

    return jsonResponse({ success: true, data: product }, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
