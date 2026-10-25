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
    const type = searchParams.get('type') || 'expenses' // 'expenses', 'inbound', 'damages', 'outbound'
    const format = searchParams.get('format') || 'json' // 'json' or 'csv'

    let rows: any[] = []
    const filename = `mht-report-${type}-${new Date().toISOString().slice(0, 10)}`

    if (type === 'expenses') {
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
      })
      rows = batches.map((b) => ({
        'Batch No': b.batch_number,
        Supplier: b.supplier_name || 'N/A',
        Category: b.category || 'General',
        'Total Quantity': b.total_quantity,
        Status: b.status,
        Date: new Date(b.created_at).toISOString().split('T')[0],
      }))
    } else if (type === 'damages') {
      const damages = await prisma.damageRecord.findMany({
        orderBy: { created_at: 'desc' },
        include: {
          barcode: { include: { batch: true } },
          user: { select: { name: true } },
        },
      })
      rows = damages.map((d) => ({
        'Damage ID': `DMG-${d.id}`,
        Barcode: d.barcode.barcode_string,
        'Batch No': d.barcode.batch.batch_number,
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
          scanned_by: { select: { name: true } },
        },
      })
      rows = dispatched.map((item) => ({
        Barcode: item.barcode_string,
        'Batch No': item.batch.batch_number,
        Category: item.batch.category || 'General',
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
