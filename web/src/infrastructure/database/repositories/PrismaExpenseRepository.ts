// ====================================================================
// Infrastructure Layer: Prisma Expense Repository
// ====================================================================

import { prisma } from '../prisma'
import { IExpenseRepository } from '@/domain/repositories'
import { ExpenseCategory, ExpenseEntity } from '@/domain/entities'
import { Prisma } from '@prisma/client'

export class PrismaExpenseRepository implements IExpenseRepository {
  async createExpense(data: {
    category: ExpenseCategory
    amount: number
    note: string
    receipt_url?: string | null
    created_by: number
  }): Promise<ExpenseEntity> {
    const expense = await prisma.expense.create({
      data: {
        category: data.category,
        amount: new Prisma.Decimal(data.amount),
        note: data.note,
        receipt_url: data.receipt_url,
        created_by: data.created_by,
      },
    })

    return {
      id: expense.id,
      category: expense.category,
      amount: Number(expense.amount),
      note: expense.note,
      receipt_url: expense.receipt_url,
      created_by: expense.created_by,
      created_at: expense.created_at,
      updated_at: expense.updated_at,
    }
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
      where.created_at = {}
      if (filter.startDate) where.created_at.gte = filter.startDate
      if (filter.endDate) where.created_at.lte = filter.endDate
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: { name: true, role: true },
        },
      },
    })

    return expenses.map((e) => ({
      id: e.id,
      category: e.category,
      amount: Number(e.amount),
      note: e.note,
      receipt_url: e.receipt_url,
      created_by: e.created_by,
      created_at: e.created_at,
      updated_at: e.updated_at,
      user: e.user,
    }))
  }

  async getTodayTotalExpense(): Promise<number> {
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const aggregate = await prisma.expense.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        created_at: { gte: startOfToday },
      },
    })

    return Number(aggregate._sum.amount ?? 0)
  }
}
