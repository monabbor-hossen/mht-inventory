// ====================================================================
// Domain & Application Errors
// Clean Architecture Custom Exceptions
// ====================================================================

export abstract class AppError extends Error {
  abstract readonly statusCode: number

  constructor(message: string) {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class ValidationError extends AppError {
  readonly statusCode = 400
}

export class UnauthorizedError extends AppError {
  readonly statusCode = 401
}

export class ForbiddenError extends AppError {
  readonly statusCode = 403
}

export class NotFoundError extends AppError {
  readonly statusCode = 404
}

export class ConflictError extends AppError {
  readonly statusCode = 409
}

// Domain-Specific Errors
export class BatchNotFoundError extends NotFoundError {
  constructor(batchIdentifier: string | number) {
    super(`Batch not found: "${batchIdentifier}"`)
  }
}

export class BarcodeNotFoundError extends NotFoundError {
  constructor(barcodeString: string) {
    super(`Barcode not found or invalid: "${barcodeString}"`)
  }
}

export class BarcodeAlreadyScannedError extends ConflictError {
  constructor(barcodeString: string, currentStatus: string) {
    super(`Barcode "${barcodeString}" cannot be scanned because it is already ${currentStatus}`)
  }
}

export class InvalidBatchStateError extends ValidationError {
  constructor(message: string) {
    super(message)
  }
}

export class UserNotFoundError extends NotFoundError {
  constructor(identifier: string | number) {
    super(`User not found: "${identifier}"`)
  }
}
