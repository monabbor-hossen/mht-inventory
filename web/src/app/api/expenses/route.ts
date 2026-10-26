// ====================================================================
// Presentation Layer: Operational Expense Ledger API Route
// ====================================================================

import { NextRequest } from 'next/server'
import { container } from '@/infrastructure/container'
import { handleApiError } from '@/presentation/errors/handleError'
import { handleCorsOptions, jsonResponse } from '@/lib/cors'
import { ExpenseCategory } from '@/domain/entities'

export async function OPTIONS() {
  return handleCorsOptions()
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryParam = searchParams.get('category') as ExpenseCategory | undefined
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    const expenses = await container.expenseUseCases.listExpenses({
      category: categoryParam,
      startDate: startDateParam ? new Date(startDateParam) : undefined,
      endDate: endDateParam ? new Date(endDateParam) : undefined,
    })

    const todayTotal = await container.expenseUseCases.getTodayTotal()

    return jsonResponse({
      success: true,
      data: expenses,
      todayTotal,
      count: expenses.length,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const expense = await container.expenseUseCases.recordExpense({
      category: (body.category || 'Labor') as ExpenseCategory,
      amount: Number(body.amount),
      title: body.title,
      note: body.note || 'Operational expense',
      receipt_url: body.receipt_url,
      expense_date: body.expense_date ? new Date(body.expense_date) : new Date(),
      created_by: body.user_id || body.userId ? Number(body.user_id || body.userId) : 1,
    })

    return jsonResponse({ success: true, data: expense }, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
