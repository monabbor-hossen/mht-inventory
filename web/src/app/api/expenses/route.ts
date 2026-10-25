import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, handleCorsOptions } from '@/lib/cors'
import { expenseRepository, expenseUseCases } from '@/application/use-cases'
import { AppError } from '@/domain/errors'
import { ExpenseCategory } from '@/domain/entities'
import { prisma } from '@/infrastructure/database/prisma'

export async function OPTIONS() {
  return handleCorsOptions()
}

// GET: Expense ledger with filtering and totals
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryParam = searchParams.get('cat') || searchParams.get('category')
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')
    const period = searchParams.get('period') // 'Today' | 'This Week' | 'This Month'

    let category: ExpenseCategory | undefined = undefined
    if (categoryParam && ['Labor', 'Transport', 'Utility', 'Others'].includes(categoryParam)) {
      category = categoryParam as ExpenseCategory
    }

    let startDate: Date | undefined = undefined
    let endDate: Date | undefined = undefined

    if (period === 'Today') {
      startDate = new Date()
      startDate.setHours(0, 0, 0, 0)
    } else if (period === 'This Week') {
      startDate = new Date()
      startDate.setDate(startDate.getDate() - 7)
    } else if (period === 'This Month') {
      startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)
    } else {
      if (startDateParam) startDate = new Date(startDateParam)
      if (endDateParam) endDate = new Date(endDateParam)
    }

    const result = await expenseUseCases.getExpenseLedger({
      category,
      startDate,
      endDate,
    })

    const todayTotal = await expenseRepository.getTodayTotalExpense()
    const assignedFund = 50000
    const cashInHand = Math.max(0, assignedFund - todayTotal)

    const formattedExpenses = result.expenses.map((e) => ({
      id: e.id,
      voucherNo: `VCH-${String(e.id).padStart(4, '0')}`,
      cat: e.category,
      category: e.category,
      amount: e.amount,
      note: e.note,
      date: new Date(e.created_at).toISOString().split('T')[0],
      time: new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      receiptUrl: e.receipt_url,
      enteredBy: (e as any).user?.name || 'Staff',
      created_at: e.created_at,
    }))

    return jsonResponse({
      success: true,
      data: formattedExpenses,
      totalAmount: result.totalExpense,
      pettyCash: {
        assignedFund,
        todayTotal,
        cashInHand,
      },
      count: formattedExpenses.length,
    })
  } catch (error: any) {
    return errorResponse('Failed to fetch expenses', 500, error?.message)
  }
}

// POST: Log new expense
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const categoryInput = body.category || body.cat || 'Others'
    const validCategory: ExpenseCategory = ['Labor', 'Transport', 'Utility', 'Others'].includes(categoryInput)
      ? (categoryInput as ExpenseCategory)
      : 'Others'

    const amount = parseFloat(String(body.amount || 0))
    const note = String(body.note || body.description || '').trim()
    const receipt_url = body.receipt_url || body.receiptUrl || null
    const userId = body.userId ? Number(body.userId) : 1

    const expense = await expenseUseCases.addExpense({
      category: validCategory,
      amount,
      note,
      receipt_url,
      userId,
    })

    return jsonResponse(
      {
        success: true,
        message: 'Expense saved successfully',
        data: {
          id: expense.id,
          voucherNo: `VCH-${String(expense.id).padStart(4, '0')}`,
          category: expense.category,
          amount: expense.amount,
          note: expense.note,
          receipt_url: expense.receipt_url,
          created_at: expense.created_at,
        },
      },
      201
    )
  } catch (error: any) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode)
    }
    return errorResponse('Failed to record expense', 500, error?.message)
  }
}

// DELETE: Role-guarded - Super Admin only
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '', 10)
    const role = request.headers.get('x-user-role') || searchParams.get('role') || ''

    if (!id) return errorResponse('Expense ID is required', 400)
    if (role !== 'Super Admin' && !role.toLowerCase().includes('admin')) {
      return errorResponse('Permission denied: Only Admin can delete financial records', 403)
    }

    await prisma.expense.delete({
      where: { id },
    })

    return jsonResponse({
      success: true,
      message: `Expense #${id} deleted successfully`,
    })
  } catch (error: any) {
    return errorResponse('Failed to delete expense', 500, error?.message)
  }
}
