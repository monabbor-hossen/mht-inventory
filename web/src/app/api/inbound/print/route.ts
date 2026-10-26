// ====================================================================
// Presentation Layer: Barcode & Thermal Sticker Generation API Route
// Generates bwip-js SVG preview, TSC TSPL commands, and Zebra ZPL commands
// ====================================================================

import { NextRequest } from 'next/server'
import { BarcodeService } from '@/infrastructure/barcode/BarcodeService'
import { container } from '@/infrastructure/container'
import { handleApiError } from '@/presentation/errors/handleError'
import { handleCorsOptions, jsonResponse } from '@/lib/cors'
import { BarcodeNotFoundError } from '@/domain/errors'

export async function OPTIONS() {
  return handleCorsOptions()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const barcodeString = body.barcode_string || body.barcode

    if (!barcodeString) {
      return jsonResponse({ success: false, error: 'Barcode string is required' }, 400)
    }

    const item = await container.barcodeRepo.findByString(barcodeString)
    if (!item) {
      throw new BarcodeNotFoundError(barcodeString)
    }

    const type = body.type === 'qrcode' ? 'qrcode' : body.type === 'datamatrix' ? 'datamatrix' : 'code128'
    const svg = await BarcodeService.generateSvg(barcodeString, type)

    const stickerData = {
      barcodeString,
      batchNumber: item.batch.batch_number,
      productName: item.product?.name ?? item.batch.category ?? 'Sack Product',
      sku: item.product?.sku ?? 'SKU-GEN',
      category: item.product?.category ?? item.batch.category ?? 'General',
      unitWeight: item.product?.unit_weight ?? 25,
      unitOfMeasure: item.product?.unit_of_measure ?? 'kg',
      locationCode: item.location?.code ?? 'DEFAULT-BIN',
    }

    const tsplCommand = BarcodeService.generateTsplCommand(stickerData)
    const zplCommand = BarcodeService.generateZplCommand(stickerData)

    return jsonResponse({
      success: true,
      data: {
        barcodeString,
        format: type,
        previewSvg: svg,
        tsplCommand,
        zplCommand,
        meta: stickerData,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
