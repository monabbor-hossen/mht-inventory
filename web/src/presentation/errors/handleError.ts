// ====================================================================
// Presentation Layer: Centralized Error Handler
// Maps Domain Exceptions to appropriate HTTP Status Codes & Structured JSON
// ====================================================================

import { NextResponse } from 'next/server'
import { AppError, FifoViolationError } from '@/domain/errors'

export function handleApiError(error: unknown): NextResponse {
  console.error('[API Error Caught]:', error)

  if (error instanceof FifoViolationError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: 'FIFO_VIOLATION',
        olderBatchNumber: error.olderBatchNumber,
        attemptedBatchNumber: error.attemptedBatchNumber,
      },
      { status: 409 }
    )
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.constructor.name,
      },
      { status: error.statusCode }
    )
  }

  if (error instanceof Error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }

  return NextResponse.json(
    {
      success: false,
      error: 'An unexpected internal warehouse system error occurred.',
      code: 'UNKNOWN_ERROR',
    },
    { status: 500 }
  )
}
