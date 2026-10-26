// ====================================================================
// Application Layer: Operational Expense Ledger Use Cases
// ====================================================================

import { IExpenseRepository, IActivityLogRepository } from '@/domain/repositories'
import { ExpenseEntity, ExpenseCategory } from '@/domain/entities'
import { CreateExpenseDto } from '../dto'
import { ValidationError } from '@/domain/errors'

export class ExpenseUseCases {
  constructor(
    private readonly expenseRepo: IExpenseRepository,
    private readonly auditRepo: IActivityLogRepository
  ) {}

  async recordExpense(dto: CreateExpenseDto): Promise<ExpenseEntity> {
    if (dto.amount <= 0) {
      throw new ValidationError('Expense amount must be greater than zero.')
    }
    if (!dto.note || dto.note.trim() === '') {
      throw new ValidationError('Expense note / description is required.')
    }

    const expense = await this.expenseRepo.createExpense(dto)

    await this.auditRepo.log({
      user_id: dto.created_by,
      action: 'CREATE',
      target_entity: 'EXPENSE',
      entity_id: String(expense.id),
      description: `Logged operational expense ${dto.amount} BDT for ${dto.category}`,
    })

    return expense
  }

  async listExpenses(filter?: {
    startDate?: Date
    endDate?: Date
    category?: ExpenseCategory
  }): Promise<ExpenseEntity[]> {
    return this.expenseRepo.findExpenses(filter)
  }

  async getTodayTotal(): Promise<number> {
    return this.expenseRepo.getTodayTotalExpense()
  }

  async addExpense(dto: { category: ExpenseCategory; amount: number; note: string; userId: number }): Promise<ExpenseEntity> {
    return this.recordExpense({
      category: dto.category,
      amount: dto.amount,
      note: dto.note,
      created_by: dto.userId,
    })
  }
}
