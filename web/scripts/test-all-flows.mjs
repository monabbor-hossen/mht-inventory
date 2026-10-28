// ====================================================================
// Automated End-to-End Verification Suite for MHT WMS
// Tests all Clean Architecture modules and APIs against live server
// ====================================================================

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function runTests() {
  const baseUrl = 'http://localhost:3000'
  console.log('🚀 Running Full Enterprise WMS Verification Suite...\n')

  let passed = 0
  let failed = 0

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`)
      passed++
    } else {
      console.error(`  ❌ FAIL: ${message}`)
      failed++
    }
  }

  try {
    // 1. Health check
    const health = await fetch(`${baseUrl}/api/health`).then(r => r.json())
    assert(health.success && health.status === 'healthy', `Health Check endpoint returns status: ${health.status}`)

    // 2. Dashboard metrics
    const dash = await fetch(`${baseUrl}/api/dashboard`).then(r => r.json())
    assert(dash.success && dash.data.summary.totalStock > 0, `Dashboard returns stock summary (${dash.data?.summary?.totalStock} bags in stock)`)

    // 3. Products catalog
    const prods = await fetch(`${baseUrl}/api/products`).then(r => r.json())
    assert(prods.success && prods.data.length >= 4, `Product Catalog returns seeded items (${prods.data?.length} SKUs found)`)

    // 4. Locations topology
    const locs = await fetch(`${baseUrl}/api/locations`).then(r => r.json())
    assert(locs.success && locs.data.length >= 6, `Warehouse Locations return physical topology (${locs.data?.length} bins found)`)

    // 5. Inbound / Inventory batches
    const inv = await fetch(`${baseUrl}/api/inventory`).then(r => r.json())
    assert(inv.success && inv.data.length >= 3, `Batches inventory listing returns active batches (${inv.data?.length} batches)`)

    // 6. Strict FIFO Enforcement Test:
    const batch1 = inv.data.find(b => b.batch_number === 'BATCH-2026-001')
    const batch2 = inv.data.find(b => b.batch_number === 'BATCH-2026-002')

    let testBarcodeForPrint = ''

    if (batch1 && batch2) {
      // Trying to dispatch from newer Batch 2 first while older Batch 1 has stock
      const newerBarcode = `MHT-RICE-MINIKET-25KG-B${batch2.id}-0001`
      const fifoFailRes = await fetch(`${baseUrl}/api/scan/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: newerBarcode, override_fifo: false }),
      })
      const fifoFailJson = await fifoFailRes.json()
      assert(
        fifoFailRes.status === 409 && fifoFailJson.code === 'FIFO_VIOLATION',
        `Strict FIFO Violation blocked newer batch dispatch (HTTP 409 FIFO_VIOLATION)`
      )

      // Find an IN_STOCK item in the oldest batch
      const inStockItem = await prisma.barcodeItem.findFirst({
        where: { batch_id: batch1.id, status: 'IN_STOCK' },
      })

      if (inStockItem) {
        testBarcodeForPrint = inStockItem.barcode_string
        const fifoPassRes = await fetch(`${baseUrl}/api/scan/dispatch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ barcode: inStockItem.barcode_string, override_fifo: false }),
        })
        const fifoPassJson = await fifoPassRes.json()
        assert(
          fifoPassRes.status === 200 && fifoPassJson.success === true,
          `FIFO compliant dispatch succeeded for oldest batch item ${inStockItem.barcode_string}`
        )
      } else {
        console.log('  ⚠️ Skipping dispatch step: all items in Batch 1 are already dispatched.')
      }
    }

    // 7. Thermal Barcode Generation (SVG + TSPL + ZPL)
    const sampleItem = await prisma.barcodeItem.findFirst()
    const printBarcode = sampleItem ? sampleItem.barcode_string : testBarcodeForPrint
    const printRes = await fetch(`${baseUrl}/api/inbound/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barcode_string: printBarcode, type: 'code128' }),
    })
    const printJson = await printRes.json()
    assert(
      printJson.success && printJson.data.previewSvg.includes('<svg') && printJson.data.tsplCommand.includes('BARCODE'),
      'Thermal sticker generation produces SVG preview and TSPL command'
    )

    // 8. Late Metadata Binding Test
    const blindBatch = await prisma.batch.findFirst({ where: { status: 'DRAFT' } })
    if (blindBatch) {
      const lateRes = await fetch(`${baseUrl}/api/inventory`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: blindBatch.id,
          supplier: 'Late Bound Supplier Corp',
          category: 'Rice & Grain',
          productId: prods.data[0].id,
          locationId: locs.data[0].id,
        }),
      })
      const lateJson = await lateRes.json()
      assert(
        lateJson.success && lateJson.data.status === 'COMPLETED',
        `Late Metadata Binding promoted ${blindBatch.batch_number} to COMPLETED status`
      )
    }

    // 9. Dynamic Batch Adjustment (+Add barcodes)
    const adjustRes = await fetch(`${baseUrl}/api/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'adjust',
        batchId: batch1.id,
        delta: 2,
      }),
    })
    const adjustJson = await adjustRes.json()
    assert(
      adjustJson.success && adjustJson.data.affectedCount === 2,
      `Dynamic quantity adjustment successfully generated 2 extra barcodes`
    )

    // 10. Offline Sync Endpoint Test (Mobile Scanner Sync)
    const syncRes = await fetch(`${baseUrl}/api/sync/offline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expenses: [
          { category: 'Utility', amount: 500, note: 'Offline Water Jar Refills' }
        ],
        userId: 1,
      }),
    })
    const syncJson = await syncRes.json()
    assert(
      syncJson.success && syncJson.data.expensesSynced === 1,
      'Offline Mobile Sync processed offline expenses queue'
    )

    // 11. Reports CSV Generation Test
    const reportRes = await fetch(`${baseUrl}/api/reports?type=valuation&format=csv`)
    const reportText = await reportRes.text()
    assert(
      reportRes.status === 200 && reportText.includes('"SKU"') && reportText.includes('"Product"'),
      'Inventory Valuation Report generated valid CSV export stream'
    )

    // 12. Cycle Counting List Test
    const cycleRes = await fetch(`${baseUrl}/api/cycle-counts`)
    const cycleJson = await cycleRes.json()
    assert(
      cycleRes.status === 200 && Array.isArray(cycleJson.data),
      `Cycle counts audit list verified (${cycleJson.data.length} audits logged)`
    )

    console.log(`\n====================================================`)
    console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed`)
    console.log(`====================================================`)

    if (failed > 0) {
      process.exit(1)
    }
  } catch (err) {
    console.error('Test run failed with error:', err)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

runTests()
