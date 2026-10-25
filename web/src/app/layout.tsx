import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MHT Inventory & Ledger | Next.js MySQL REST API',
  description: 'Production-ready Next.js REST API with MySQL connection pooling for warehouse management, scanning, ledger, and offline sync.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220%22><text y=%2226%22 font-size=%2224%22>📦</text></svg>" />
      </head>
      <body>{children}</body>
    </html>
  )
}
