// ====================================================================
// Application Layer: Expense Use Cases
// ====================================================================

import { IActivityLogRepository, IExpenseRepository } from '@/domain/repositories'
import { ValidationError } from '@/domain/errors'
import { AddExpenseDTO } from '../dto'
import { ExpenseCategory, ExpenseEntity } from '@/domain/entities'

export class ExpenseUseCases {
  constructor(
    private readonly expenseRepo: IExpenseRepository,
    private readonly activityLogRepo: IActivityLogRepository
  ) {}

  /**
   * Module B: Log Expense
   */
  async addExpense(dto: AddExpenseDTO): Promise<ExpenseEntity> {
    if (!dto.amount || dto.amount <= 0) {
      throw new ValidationError('Expense amount must be greater than zero')
    }
    if (!dto.note?.trim()) {
      throw new ValidationError('A description or note is required for the expense')
    }

    const expense = await this.expenseRepo.createExpense({
      category: dto.category,
      amount: dto.amount,
      note: dto.note.trim(),
      receipt_url: dto.receipt_url ?? null,
      created_by: dto.userId,
    })

    await this.activityLogRepo.log({
      user_id: dto.userId,
      action: 'CREATE',
      target_entity: 'Expense',
      description: `Logged expense of ৳${dto.amount} under [${dto.category}]: "${dto.note}"`,
    })

    return expense
  }

  /**
   * Module B: Centralized Ledger View & Analytics
   */
  async getExpenseLedger(filter?: {
    startDate?: Date
    endDate?: Date
    category?: ExpenseCategory
  }): Promise<{
    expenses: ExpenseEntity[]
    totalExpense: number
  }> {
    const expenses = await this.expenseRepo.findExpenses(filter)
    const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0)

    return {
      expenses,
      totalExpense,
    }
  }
}
