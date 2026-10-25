// ====================================================================
// Application Layer: Mobile Offline Sync Use Case
// ====================================================================

import { InventoryUseCases } from './InventoryUseCases'
import { ExpenseUseCases } from './ExpenseUseCases'
import { OfflineSyncDTO } from '../dto'

export class OfflineSyncUseCase {
  constructor(
    private readonly inventoryUseCases: InventoryUseCases,
    private readonly expenseUseCases: ExpenseUseCases
  ) {}

  async execute(dto: OfflineSyncDTO): Promise<{
    success: boolean
    dispatchesSynced: number
    damagesSynced: number
    expensesSynced: number
    errors: string[]
  }> {
    let dispatchesSynced = 0
    let damagesSynced = 0
    let expensesSynced = 0
    const errors: string[] = []

    const userId = dto.userId ?? 1

    // 1. Process offline dispatches
    if (dto.dispatches && dto.dispatches.length > 0) {
      for (const item of dto.dispatches) {
        try {
          await this.inventoryUseCases.dispatchScan({
            barcode_string: item.barcode,
            userId,
          })
          dispatchesSynced++
        } catch (err: any) {
          errors.push(`Dispatch [${item.barcode}]: ${err.message}`)
        }
      }
    }

    // 2. Process offline damages
    if (dto.damages && dto.damages.length > 0) {
      for (const item of dto.damages) {
        try {
          await this.inventoryUseCases.recordDamage({
            barcode_string: item.barcode,
            reason: item.reason,
            photo_url: item.photo_url,
            userId,
          })
          damagesSynced++
        } catch (err: any) {
          errors.push(`Damage [${item.barcode}]: ${err.message}`)
        }
      }
    }

    // 3. Process offline expenses
    if (dto.expenses && dto.expenses.length > 0) {
      for (const item of dto.expenses) {
        try {
          await this.expenseUseCases.addExpense({
            category: item.category,
            amount: item.amount,
            note: item.note,
            userId,
          })
          expensesSynced++
        } catch (err: any) {
          errors.push(`Expense [${item.note}]: ${err.message}`)
        }
      }
    }

    return {
      success: errors.length === 0,
      dispatchesSynced,
      damagesSynced,
      expensesSynced,
      errors,
    }
  }
}
