import { jsonResponse, errorResponse, handleCorsOptions } from '@/lib/cors'
import { dashboardUseCases } from '@/application/use-cases'

export async function OPTIONS() {
  return handleCorsOptions()
}

export async function GET() {
  try {
    const data = await dashboardUseCases.getDashboardData()

    const formattedWeeklyFlow = data.weeklyFlow.map((f) => ({
      day: f.day,
      date: f.day,
      stockIn: f.inbound,
      stockOut: f.outbound,
    }))

    const formattedRecentActivity = data.recentLogs.map((log) => ({
      key: `LOG-${log.id}`,
      date: new Date(log.timestamp).toLocaleDateString(),
      time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      batch: log.target_entity,
      product: log.description,
      bags: 1,
      by: (log as any).user?.name || 'Staff',
      dir: log.action === 'CREATE' ? 'In' : 'Out',
    }))

    return jsonResponse({
      success: true,
      data: {
        summary: {
          totalStock: data.totalInStock,
          inStockBags: data.totalInStock,
          dispatchedToday: data.dispatchedToday,
          expensesToday: data.totalExpenseToday,
          dailyExpenses: data.totalExpenseToday,
          damagedStock: data.totalDamageCount,
          damageCount: data.totalDamageCount,
        },
        weeklyFlow: formattedWeeklyFlow,
        recentActivity: formattedRecentActivity,
        recentBatches: data.recentBatches,
        recentLogs: data.recentLogs,
      },
    })
  } catch (error: any) {
    return errorResponse('Failed to fetch dashboard data', 500, error?.message)
  }
}
