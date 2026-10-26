// ====================================================================
// Presentation Layer: Exportable Reports API Route
// CSV & JSON exports for Valuation, Movement Ledger, Inbound, Damages & Expenses
// ====================================================================

import { NextRequest, NextResponse } from 'next/server'
import { jsonResponse, errorResponse, handleCorsOptions, corsHeaders } from '@/lib/cors'
import { prisma } from '@/infrastructure/database/prisma'

export async function OPTIONS() {
  return handleCorsOptions()
}

function csvCell(value: any): string {
  const text = String(value ?? '')
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text
  return `"${safe.replace(/"/g, '""')}"`
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'expenses' // 'valuation', 'movements', 'expenses', 'inbound', 'damages', 'outbound'
    const format = searchParams.get('format') || 'json' // 'json' or 'csv'

    let rows: any[] = []
    const filename = `wms-report-${type}-${new Date().toISOString().slice(0, 10)}`

    if (type === 'valuation') {
      const products = await prisma.product.findMany({
        include: {
          _count: {
            select: { barcode_items: { where: { status: 'IN_STOCK' } } },
          },
        },
      })
      rows = products.map((p) => ({
        SKU: p.sku,
        Product: p.name,
        Category: p.category,
        'Unit Weight (kg)': Number(p.unit_weight),
        'In Stock Quantity': p._count.barcode_items,
        'Total Mass (kg)': p._count.barcode_items * Number(p.unit_weight),
        Status: p.is_active ? 'ACTIVE' : 'INACTIVE',
      }))
    } else if (type === 'movements') {
      const txs = await prisma.inventoryTransaction.findMany({
        orderBy: { created_at: 'desc' },
        take: 200,
        include: {
          product: true,
          batch: true,
          from_location: true,
          to_location: true,
          user: true,
        },
      })
      rows = txs.map((tx) => ({
        'Transaction ID': `TX-${tx.id}`,
        Movement: tx.movement_type,
        Product: tx.product?.name ?? 'N/A',
        Batch: tx.batch?.batch_number ?? 'N/A',
        'From Location': tx.from_location?.code ?? 'N/A',
        'To Location': tx.to_location?.code ?? 'N/A',
        Quantity: tx.quantity,
        User: tx.user?.name ?? 'System',
        Notes: tx.notes ?? '',
        Date: new Date(tx.created_at).toISOString().replace('T', ' ').slice(0, 19),
      }))
    } else if (type === 'expenses') {
      const expenses = await prisma.expense.findMany({
        orderBy: { created_at: 'desc' },
        include: { user: { select: { name: true } } },
      })
      rows = expenses.map((e) => ({
        'Voucher No': `VCH-${String(e.id).padStart(4, '0')}`,
        Category: e.category,
        'Amount (BDT)': Number(e.amount),
        Note: e.note,
        'Entered By': e.user.name,
        Date: new Date(e.created_at).toISOString().split('T')[0],
      }))
    } else if (type === 'inbound') {
      const batches = await prisma.batch.findMany({
        orderBy: { created_at: 'desc' },
        include: { product: true },
      })
      rows = batches.map((b) => ({
        'Batch No': b.batch_number,
        Product: b.product?.name ?? 'N/A',
        Supplier: b.supplier_name || 'N/A',
        Category: b.category || 'General',
        'Received Quantity': b.received_quantity,
        'Expected Quantity': b.expected_quantity,
        Status: b.status,
        Date: new Date(b.created_at).toISOString().split('T')[0],
      }))
    } else if (type === 'damages') {
      const damages = await prisma.damageRecord.findMany({
        orderBy: { created_at: 'desc' },
        include: {
          barcode: { include: { batch: true, product: true } },
          user: { select: { name: true } },
        },
      })
      rows = damages.map((d) => ({
        'Damage ID': `DMG-${d.id}`,
        Barcode: d.barcode.barcode_string,
        'Batch No': d.barcode.batch.batch_number,
        Product: d.barcode.product?.name ?? 'General',
        Reason: d.reason,
        'Reported By': d.user.name,
        Date: new Date(d.created_at).toISOString().split('T')[0],
      }))
    } else {
      // Outbound / Dispatched Barcodes
      const dispatched = await prisma.barcodeItem.findMany({
        where: { status: 'DISPATCHED' },
        orderBy: { dispatched_at: 'desc' },
        include: {
          batch: true,
          product: true,
          scanned_by: { select: { name: true } },
        },
      })
      rows = dispatched.map((item) => ({
        Barcode: item.barcode_string,
        Product: item.product?.name ?? 'General',
        'Batch No': item.batch.batch_number,
        'Scanned By': item.scanned_by?.name || 'Staff',
        'Dispatched At': item.dispatched_at ? new Date(item.dispatched_at).toISOString() : 'N/A',
      }))
    }

    if (format === 'csv') {
      if (rows.length === 0) {
        return new NextResponse('No data available for export', {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${filename}.csv"`,
          },
        })
      }

      const headers = Object.keys(rows[0])
      const csvLines = [
        headers.map(csvCell).join(','),
        ...rows.map((row) => headers.map((key) => csvCell(row[key])).join(',')),
      ]
      const csvContent = '\uFEFF' + csvLines.join('\r\n')

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      })
    }

    return jsonResponse({
      success: true,
      reportType: type,
      totalRecords: rows.length,
      data: rows,
    })
  } catch (error: any) {
    return errorResponse('Failed to generate report', 500, error?.message)
  }
}
