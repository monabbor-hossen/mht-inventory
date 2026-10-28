// ====================================================================
// Database Seed Script (Prisma)
// Enterprise WMS: Users, Product Master, Topology, Batches, Barcodes,
// Ledger Transactions, Damages, and Petty Expenses
// ====================================================================

import { PrismaClient, Role, BatchStatus, BarcodeStatus, TransactionType, ExpenseCategory, DamageReason, LogAction } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding MHT Enterprise WMS database...')

  const defaultPassword = 'password123'
  const passwordHash = await bcrypt.hash(defaultPassword, 10)

  // 1. Seed Users (RBAC)
  const admin = await prisma.user.upsert({
    where: { id: 1 },
    update: {
      username: 'admin',
      name: 'Mahmudul H. (Admin)',
      role: Role.ADMIN,
      password_hash: passwordHash,
      is_active: true,
    },
    create: {
      id: 1,
      username: 'admin',
      name: 'Mahmudul H. (Admin)',
      role: Role.ADMIN,
      password_hash: passwordHash,
      is_active: true,
    },
  })

  const manager = await prisma.user.upsert({
    where: { id: 2 },
    update: {
      username: 'manager',
      name: 'Kamal H. (Manager)',
      role: Role.MANAGER,
      password_hash: passwordHash,
      is_active: true,
    },
    create: {
      id: 2,
      username: 'manager',
      name: 'Kamal H. (Manager)',
      role: Role.MANAGER,
      password_hash: passwordHash,
      is_active: true,
    },
  })

  const staff = await prisma.user.upsert({
    where: { id: 3 },
    update: {
      username: 'staff',
      name: 'Rafiqul I. (Staff)',
      role: Role.STAFF,
      password_hash: passwordHash,
      is_active: true,
    },
    create: {
      id: 3,
      username: 'staff',
      name: 'Rafiqul I. (Staff)',
      role: Role.STAFF,
      password_hash: passwordHash,
      is_active: true,
    },
  })

  console.log('✅ Users seeded: admin, manager, staff')

  // 2. Seed Master Products
  const productsData = [
    {
      sku: 'RICE-MINIKET-25KG',
      name: 'Miniket Premium Polished Rice (25kg)',
      category: 'Rice & Grain',
      unit_weight: 25.0,
      unit_of_measure: 'kg',
      min_stock_alert: 50,
      description: 'First grade fine polished Miniket rice sack for commercial retail distribution',
    },
    {
      sku: 'RICE-NAZIR-25KG',
      name: 'Nazirshail Steam Grain Rice (25kg)',
      category: 'Rice & Grain',
      unit_weight: 25.0,
      unit_of_measure: 'kg',
      min_stock_alert: 40,
      description: 'Long grain steam processed premium Nazirshail rice sack',
    },
    {
      sku: 'FLOUR-ATTA-50KG',
      name: 'Fortified Whole Wheat Atta (50kg)',
      category: 'Wheat & Flour',
      unit_weight: 50.0,
      unit_of_measure: 'kg',
      min_stock_alert: 30,
      description: 'Double roller milled whole wheat flour packed in moisture-resistant 50kg bag',
    },
    {
      sku: 'LENTIL-MASOOR-25KG',
      name: 'Imported Red Masoor Lentils (25kg)',
      category: 'Pulses & Lentils',
      unit_weight: 25.0,
      unit_of_measure: 'kg',
      min_stock_alert: 25,
      description: 'Sortex cleaned premium Canadian whole red masoor dal bag',
    },
  ]

  const seededProducts: Record<string, any> = {}
  for (const p of productsData) {
    const prod = await prisma.product.upsert({
      where: { sku: p.sku },
      update: p,
      create: p,
    })
    seededProducts[p.sku] = prod
  }
  console.log('✅ Master Products seeded:', Object.keys(seededProducts))

  // 3. Seed Warehouse Topology (Locations & Bins)
  const locationsData = [
    {
      code: 'ZA-A01-R01-B01',
      zone: 'Zone A (Rice Bulk)',
      aisle: 'A01',
      rack: 'R01',
      bin: 'B01',
      max_capacity: 150,
      description: 'Main floor pallet position 1 for 25kg rice sacks',
    },
    {
      code: 'ZA-A01-R01-B02',
      zone: 'Zone A (Rice Bulk)',
      aisle: 'A01',
      rack: 'R01',
      bin: 'B02',
      max_capacity: 150,
      description: 'Main floor pallet position 2 for 25kg rice sacks',
    },
    {
      code: 'ZB-A01-R01-B01',
      zone: 'Zone B (Flour & Wheat)',
      aisle: 'A01',
      rack: 'R01',
      bin: 'B01',
      max_capacity: 100,
      description: 'Heavy duty rack shelf for 50kg flour bags',
    },
    {
      code: 'ZC-A01-R01-B01',
      zone: 'Zone C (Pulses)',
      aisle: 'A01',
      rack: 'R01',
      bin: 'B01',
      max_capacity: 80,
      description: 'Clean dry rack for pulses and lentils',
    },
    {
      code: 'ZD-COLD-01',
      zone: 'Zone D (Cold Storage)',
      aisle: 'A01',
      rack: 'R01',
      bin: 'B01',
      max_capacity: 50,
      description: 'Temperature and humidity controlled chamber',
    },
    {
      code: 'ZE-TRANSIT-01',
      zone: 'Zone E (Transit / Dispatch Bay)',
      aisle: 'A01',
      rack: 'R01',
      bin: 'B01',
      max_capacity: 200,
      description: 'Staging dock for outbound freight loading',
    },
  ]

  const seededLocations: Record<string, any> = {}
  for (const loc of locationsData) {
    const l = await prisma.location.upsert({
      where: { code: loc.code },
      update: loc,
      create: loc,
    })
    seededLocations[loc.code] = l
  }
  console.log('✅ Warehouse Locations seeded:', Object.keys(seededLocations))

  // 4. Seed Batches & Serialized Barcode Items with FIFO setup
  const now = new Date()
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)

  // Batch 1: Older batch of Miniket Rice (BATCH-2026-001)
  const batch1 = await prisma.batch.upsert({
    where: { batch_number: 'BATCH-2026-001' },
    update: {
      supplier_name: 'Apex Agro Mills Ltd.',
      product_id: seededProducts['RICE-MINIKET-25KG'].id,
      category: 'Rice & Grain',
      entry_date: fiveDaysAgo,
      expected_quantity: 10,
      received_quantity: 10,
      status: BatchStatus.COMPLETED,
      notes: 'Initial opening stock receipt',
    },
    create: {
      batch_number: 'BATCH-2026-001',
      supplier_name: 'Apex Agro Mills Ltd.',
      product_id: seededProducts['RICE-MINIKET-25KG'].id,
      category: 'Rice & Grain',
      entry_date: fiveDaysAgo,
      expected_quantity: 10,
      received_quantity: 10,
      status: BatchStatus.COMPLETED,
      notes: 'Initial opening stock receipt',
    },
  })

  // Barcodes for Batch 1 (10 units: 2 dispatched, 1 damaged, 7 in stock)
  for (let i = 1; i <= 10; i++) {
    const seq = String(i).padStart(4, '0')
    const barcodeStr = `MHT-RICE-MINIKET-25KG-B${batch1.id}-${seq}`
    let status: BarcodeStatus = BarcodeStatus.IN_STOCK
    let dispatchedAt: Date | null = null
    let scannedBy: number | null = null

    if (i <= 2) {
      status = BarcodeStatus.DISPATCHED
      dispatchedAt = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
      scannedBy = staff.id
    } else if (i === 3) {
      status = BarcodeStatus.DAMAGED
      scannedBy = staff.id
    }

    const item = await prisma.barcodeItem.upsert({
      where: { barcode_string: barcodeStr },
      update: {
        batch_id: batch1.id,
        product_id: seededProducts['RICE-MINIKET-25KG'].id,
        location_id: seededLocations['ZA-A01-R01-B01'].id,
        status,
        dispatched_at: dispatchedAt,
        scanned_by_user_id: scannedBy,
      },
      create: {
        barcode_string: barcodeStr,
        batch_id: batch1.id,
        product_id: seededProducts['RICE-MINIKET-25KG'].id,
        location_id: seededLocations['ZA-A01-R01-B01'].id,
        status,
        dispatched_at: dispatchedAt,
        scanned_by_user_id: scannedBy,
      },
    })

    // Seed damage record for item 3
    if (i === 3) {
      await prisma.damageRecord.upsert({
        where: { barcode_id: item.id },
        update: {
          reason: DamageReason.Torn,
          notes: 'Sack torn during truck offloading at unloading bay',
          logged_by: staff.id,
        },
        create: {
          barcode_id: item.id,
          reason: DamageReason.Torn,
          notes: 'Sack torn during truck offloading at unloading bay',
          logged_by: staff.id,
        },
      })
    }

    // Ledger transactions
    const existingTx = await prisma.inventoryTransaction.findFirst({
      where: { barcode_item_id: item.id, movement_type: TransactionType.IN },
    })
    if (!existingTx) {
      await prisma.inventoryTransaction.create({
        data: {
          barcode_item_id: item.id,
          product_id: seededProducts['RICE-MINIKET-25KG'].id,
          batch_id: batch1.id,
          to_location_id: seededLocations['ZA-A01-R01-B01'].id,
          movement_type: TransactionType.IN,
          quantity: 1,
          user_id: admin.id,
          reference_number: batch1.batch_number,
          notes: `Inbound opening stock for ${barcodeStr}`,
        },
      })
    }

    if (status === BarcodeStatus.DISPATCHED) {
      const existingOutTx = await prisma.inventoryTransaction.findFirst({
        where: { barcode_item_id: item.id, movement_type: TransactionType.OUT },
      })
      if (!existingOutTx) {
        await prisma.inventoryTransaction.create({
          data: {
            barcode_item_id: item.id,
            product_id: seededProducts['RICE-MINIKET-25KG'].id,
            batch_id: batch1.id,
            from_location_id: seededLocations['ZA-A01-R01-B01'].id,
            movement_type: TransactionType.OUT,
            quantity: 1,
            user_id: staff.id,
            reference_number: `DO-${batch1.id}-${seq}`,
            notes: `Dispatched to retailer customer for ${barcodeStr}`,
          },
        })
      }
    }
  }

  // Batch 2: Newer batch of Miniket Rice (BATCH-2026-002) - for strict FIFO testing!
  const batch2 = await prisma.batch.upsert({
    where: { batch_number: 'BATCH-2026-002' },
    update: {
      supplier_name: 'Apex Agro Mills Ltd.',
      product_id: seededProducts['RICE-MINIKET-25KG'].id,
      category: 'Rice & Grain',
      entry_date: now,
      expected_quantity: 10,
      received_quantity: 10,
      status: BatchStatus.COMPLETED,
      notes: 'Second shipment (Newer batch) - FIFO protection target',
    },
    create: {
      batch_number: 'BATCH-2026-002',
      supplier_name: 'Apex Agro Mills Ltd.',
      product_id: seededProducts['RICE-MINIKET-25KG'].id,
      category: 'Rice & Grain',
      entry_date: now,
      expected_quantity: 10,
      received_quantity: 10,
      status: BatchStatus.COMPLETED,
      notes: 'Second shipment (Newer batch) - FIFO protection target',
    },
  })

  for (let i = 1; i <= 10; i++) {
    const seq = String(i).padStart(4, '0')
    const barcodeStr = `MHT-RICE-MINIKET-25KG-B${batch2.id}-${seq}`
    const item = await prisma.barcodeItem.upsert({
      where: { barcode_string: barcodeStr },
      update: {
        batch_id: batch2.id,
        product_id: seededProducts['RICE-MINIKET-25KG'].id,
        location_id: seededLocations['ZA-A01-R01-B02'].id,
        status: BarcodeStatus.IN_STOCK,
      },
      create: {
        barcode_string: barcodeStr,
        batch_id: batch2.id,
        product_id: seededProducts['RICE-MINIKET-25KG'].id,
        location_id: seededLocations['ZA-A01-R01-B02'].id,
        status: BarcodeStatus.IN_STOCK,
      },
    })

    const existingTx = await prisma.inventoryTransaction.findFirst({
      where: { barcode_item_id: item.id, movement_type: TransactionType.IN },
    })
    if (!existingTx) {
      await prisma.inventoryTransaction.create({
        data: {
          barcode_item_id: item.id,
          product_id: seededProducts['RICE-MINIKET-25KG'].id,
          batch_id: batch2.id,
          to_location_id: seededLocations['ZA-A01-R01-B02'].id,
          movement_type: TransactionType.IN,
          quantity: 1,
          user_id: manager.id,
          reference_number: batch2.batch_number,
          notes: `Inbound receipt for ${barcodeStr}`,
        },
      })
    }
  }

  // Batch 3: Flour Batch (BATCH-2026-003)
  const batch3 = await prisma.batch.upsert({
    where: { batch_number: 'BATCH-2026-003' },
    update: {
      supplier_name: 'Meghna Flour Mills Ltd.',
      product_id: seededProducts['FLOUR-ATTA-50KG'].id,
      category: 'Wheat & Flour',
      entry_date: threeDaysAgo,
      expected_quantity: 8,
      received_quantity: 8,
      status: BatchStatus.COMPLETED,
      notes: 'Whole wheat flour shipment',
    },
    create: {
      batch_number: 'BATCH-2026-003',
      supplier_name: 'Meghna Flour Mills Ltd.',
      product_id: seededProducts['FLOUR-ATTA-50KG'].id,
      category: 'Wheat & Flour',
      entry_date: threeDaysAgo,
      expected_quantity: 8,
      received_quantity: 8,
      status: BatchStatus.COMPLETED,
      notes: 'Whole wheat flour shipment',
    },
  })

  for (let i = 1; i <= 8; i++) {
    const seq = String(i).padStart(4, '0')
    const barcodeStr = `MHT-FLOUR-ATTA-50KG-B${batch3.id}-${seq}`
    const item = await prisma.barcodeItem.upsert({
      where: { barcode_string: barcodeStr },
      update: {
        batch_id: batch3.id,
        product_id: seededProducts['FLOUR-ATTA-50KG'].id,
        location_id: seededLocations['ZB-A01-R01-B01'].id,
        status: BarcodeStatus.IN_STOCK,
      },
      create: {
        barcode_string: barcodeStr,
        batch_id: batch3.id,
        product_id: seededProducts['FLOUR-ATTA-50KG'].id,
        location_id: seededLocations['ZB-A01-R01-B01'].id,
        status: BarcodeStatus.IN_STOCK,
      },
    })

    const existingTx = await prisma.inventoryTransaction.findFirst({
      where: { barcode_item_id: item.id, movement_type: TransactionType.IN },
    })
    if (!existingTx) {
      await prisma.inventoryTransaction.create({
        data: {
          barcode_item_id: item.id,
          product_id: seededProducts['FLOUR-ATTA-50KG'].id,
          batch_id: batch3.id,
          to_location_id: seededLocations['ZB-A01-R01-B01'].id,
          movement_type: TransactionType.IN,
          quantity: 1,
          user_id: manager.id,
          reference_number: batch3.batch_number,
          notes: `Inbound receipt for ${barcodeStr}`,
        },
      })
    }
  }

  // Batch 4: DRAFT Blind Receipt (for Late Metadata Binding testing)
  const batch4 = await prisma.batch.upsert({
    where: { batch_number: 'BLIND-902144' },
    update: {
      supplier_name: 'Spot Delivery',
      product_id: null,
      category: 'DRAFT Unassigned',
      entry_date: now,
      expected_quantity: 5,
      received_quantity: 5,
      status: BatchStatus.DRAFT,
      notes: 'Quick spot delivery received without PO manifest',
    },
    create: {
      batch_number: 'BLIND-902144',
      supplier_name: 'Spot Delivery',
      product_id: null,
      category: 'DRAFT Unassigned',
      entry_date: now,
      expected_quantity: 5,
      received_quantity: 5,
      status: BatchStatus.DRAFT,
      notes: 'Quick spot delivery received without PO manifest',
    },
  })

  for (let i = 1; i <= 5; i++) {
    const seq = String(i).padStart(4, '0')
    const barcodeStr = `MHT-BLIND902144-B${batch4.id}-${seq}`
    await prisma.barcodeItem.upsert({
      where: { barcode_string: barcodeStr },
      update: {
        batch_id: batch4.id,
        product_id: null,
        location_id: seededLocations['ZE-TRANSIT-01'].id,
        status: BarcodeStatus.DRAFT,
      },
      create: {
        barcode_string: barcodeStr,
        batch_id: batch4.id,
        product_id: null,
        location_id: seededLocations['ZE-TRANSIT-01'].id,
        status: BarcodeStatus.DRAFT,
      },
    })
  }

  console.log('✅ Batches & Barcode Items seeded successfully (including FIFO test scenario)')

  // 5. Seed Warehouse Petty Expenses
  const expensesData = [
    {
      category: ExpenseCategory.Labor,
      amount: 4500.0,
      title: 'Day Shift Sack Loading Labor',
      note: '3 manual laborers for 4 hours unloading cargo truck #Dhaka-Metro-12',
      created_by: manager.id,
    },
    {
      category: ExpenseCategory.Transport,
      amount: 6200.0,
      title: 'Warehouse Shuttle Van Fuel & Toll',
      note: 'Shuttle trips between North Silo depot and Bay 1 dock',
      created_by: manager.id,
    },
    {
      category: ExpenseCategory.Utility,
      amount: 1850.0,
      title: 'Generator Diesel Top-up',
      note: 'Fuel for standby generator during 2hr grid power outage',
      created_by: staff.id,
    },
  ]

  for (const exp of expensesData) {
    const existing = await prisma.expense.findFirst({
      where: { title: exp.title },
    })
    if (!existing) {
      await prisma.expense.create({ data: exp })
    }
  }
  console.log('✅ Petty Expenses seeded')

  // 6. Seed Sample Activity Logs
  const logsData = [
    {
      user_id: admin.id,
      action: LogAction.CREATE,
      target_entity: 'PRODUCT',
      entity_id: 'RICE-MINIKET-25KG',
      description: 'Master catalog SKU RICE-MINIKET-25KG created',
    },
    {
      user_id: manager.id,
      action: LogAction.CREATE,
      target_entity: 'BATCH',
      entity_id: 'BATCH-2026-001',
      description: 'Inbound shipment received for BATCH-2026-001 (10 units)',
    },
    {
      user_id: staff.id,
      action: LogAction.DISPATCH,
      target_entity: 'BARCODE',
      entity_id: `MHT-RICE-MINIKET-25KG-B${batch1.id}-0001`,
      description: 'Dispatched unit MHT-RICE-MINIKET-25KG-B1-0001 (FIFO compliant)',
    },
  ]

  for (const log of logsData) {
    await prisma.activityLog.create({ data: log })
  }
  console.log('✅ Activity Logs seeded')

  console.log('🎉 Database seeding completed successfully!')
  console.log('🔑 Credentials for test accounts:')
  console.log('   Admin:    admin / password123')
  console.log('   Manager:  manager / password123')
  console.log('   Staff:    staff / password123')
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
