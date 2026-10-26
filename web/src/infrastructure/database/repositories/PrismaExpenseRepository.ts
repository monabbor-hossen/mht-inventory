// ====================================================================
// Infrastructure Layer: Prisma Expense Repository
// ====================================================================

import { prisma } from '../prisma'
import { IExpenseRepository } from '@/domain/repositories'
import { ExpenseCategory, ExpenseEntity, UserEntity } from '@/domain/entities'
import { Prisma } from '@prisma/client'

export class PrismaExpenseRepository implements IExpenseRepository {
  private mapExpense(e: any): ExpenseEntity {
    return {
      id: e.id,
      category: e.category as ExpenseCategory,
      amount: Number(e.amount),
      title: e.title,
      note: e.note,
      receipt_url: e.receipt_url,
      expense_date: e.expense_date,
      created_by: e.created_by,
      created_at: e.created_at,
      updated_at: e.updated_at,
      user: e.user ? (e.user as UserEntity) : null,
    }
  }

  async createExpense(data: {
    category: ExpenseCategory
    amount: number
    title?: string | null
    note: string
    receipt_url?: string | null
    expense_date?: Date
    created_by: number
  }): Promise<ExpenseEntity> {
    const expense = await prisma.expense.create({
      data: {
        category: data.category,
        amount: new Prisma.Decimal(data.amount),
        title: data.title,
        note: data.note,
        receipt_url: data.receipt_url,
        expense_date: data.expense_date ?? new Date(),
        created_by: data.created_by,
      },
      include: { user: true },
    })

    return this.mapExpense(expense)
  }

  async findExpenses(filter?: {
    startDate?: Date
    endDate?: Date
    category?: ExpenseCategory
  }): Promise<ExpenseEntity[]> {
    const where: Prisma.ExpenseWhereInput = {}

    if (filter?.category) {
      where.category = filter.category
    }

    if (filter?.startDate || filter?.endDate) {
      where.expense_date = {}
      if (filter.startDate) where.expense_date.gte = filter.startDate
      if (filter.endDate) where.expense_date.lte = filter.endDate
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { expense_date: 'desc' },
      include: { user: true },
    })

    return expenses.map((e) => this.mapExpense(e))
  }

  async getTodayTotalExpense(): Promise<number> {
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const aggregate = await prisma.expense.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        expense_date: { gte: startOfToday },
      },
    })

    return Number(aggregate._sum.amount ?? 0)
  }
}
