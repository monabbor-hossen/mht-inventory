import mysql from 'mysql2/promise'

// Global connection pool cache for Next.js hot-reloading in development
declare global {
  // eslint-disable-next-line no-var
  var __mysqlPool: mysql.Pool | undefined
}

export function getDbConfig() {
  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'inventory_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    connectTimeout: 10000,
  }
}

export function getPool(): mysql.Pool {
  if (process.env.NODE_ENV === 'production') {
    return mysql.createPool(getDbConfig())
  }

  if (!global.__mysqlPool) {
    global.__mysqlPool = mysql.createPool(getDbConfig())
  }

  return global.__mysqlPool
}

export async function query<T = any>(sql: string, params?: any[]): Promise<T> {
  const pool = getPool()
  try {
    const [results] = await pool.execute(sql, params)
    return results as T
  } catch (error: any) {
    console.error('MySQL Query Error:', {
      sql,
      params,
      message: error?.message,
      code: error?.code,
    })
    throw error
  }
}

export async function testConnection(): Promise<{
  connected: boolean
  message: string
  config: { host: string; port: number; user: string; database: string }
  serverVersion?: string
}> {
  const config = getDbConfig()
  const displayConfig = {
    host: config.host,
    port: config.port,
    user: config.user,
    database: config.database,
  }

  try {
    const pool = getPool()
    const [rows]: [any, any] = await pool.query('SELECT 1 as test, VERSION() as version')
    return {
      connected: true,
      message: 'Successfully connected to MySQL database',
      config: displayConfig,
      serverVersion: rows[0]?.version,
    }
  } catch (error: any) {
    return {
      connected: false,
      message: `Failed to connect to MySQL: ${error?.message || 'Unknown error'}`,
      config: displayConfig,
    }
  }
}
