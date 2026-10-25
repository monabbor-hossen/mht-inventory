import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import mysql from 'mysql2/promise'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const host = process.env.DB_HOST || '127.0.0.1'
const port = parseInt(process.env.DB_PORT || '3306', 10)
const user = process.env.DB_USER || 'root'
const password = process.env.DB_PASSWORD || ''
const database = process.env.DB_NAME || 'inventory_db'

console.log(`[InitDB] Connecting to MySQL at ${host}:${port} as ${user}...`)

try {
  const connection = await mysql.createConnection({ host, port, user, password })
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`)
  await connection.query(`USE \`${database}\`;`)
  console.log(`[InitDB] Database \`${database}\` verified.`)
  await connection.end()
  console.log(`[InitDB] Done! You can now run the app.`)
} catch (err) {
  console.error(`[InitDB] Error:`, err.message)
  process.exit(1)
}
