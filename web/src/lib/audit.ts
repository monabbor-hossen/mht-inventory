import { query } from './db'

export async function logActivity({
  userId,
  userName,
  actionType,
  targetId,
  description,
}: {
  userId: string
  userName: string
  actionType: string
  targetId: string
  description: string
}) {
  try {
    await query(
      `INSERT INTO activity_logs (user_id, user_name, action_type, target_id, description)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, userName, actionType, targetId, description]
    )
  } catch (error) {
    console.error('Failed to write activity log:', error)
  }
}
