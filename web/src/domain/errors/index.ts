// ====================================================================
// Domain & Application Errors
// Clean Architecture Custom Exceptions mapped to domain scenarios
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

// --------------------------------------------------
// Specific Domain Errors
// --------------------------------------------------

// Product Domain Errors
export class ProductNotFoundError extends NotFoundError {
  constructor(identifier: string | number) {
    super(`Product not found: "${identifier}"`)
  }
}

export class ProductAlreadyExistsError extends ConflictError {
  constructor(sku: string) {
    super(`Product with SKU "${sku}" already exists.`)
  }
}

// Batch Domain Errors
export class BatchNotFoundError extends NotFoundError {
  constructor(batchIdentifier: string | number) {
    super(`Batch not found: "${batchIdentifier}"`)
  }
}

export class InvalidBatchStateError extends ValidationError {
  constructor(message: string) {
    super(message)
  }
}

// Location Domain Errors
export class LocationNotFoundError extends NotFoundError {
  constructor(identifier: string | number) {
    super(`Location not found: "${identifier}"`)
  }
}

export class LocationCapacityExceededError extends ConflictError {
  constructor(locationCode: string, capacity: number) {
    super(`Location "${locationCode}" has reached maximum capacity (${capacity} units).`)
  }
}

// Barcode & Inventory Item Errors
export class BarcodeNotFoundError extends NotFoundError {
  constructor(barcodeString: string) {
    super(`Barcode not found or invalid: "${barcodeString}"`)
  }
}

export class BarcodeAlreadyExistsError extends ConflictError {
  constructor(barcodeString: string) {
    super(`Barcode "${barcodeString}" already exists in the system.`)
  }
}

export class BarcodeAlreadyScannedError extends ConflictError {
  constructor(barcodeString: string, currentStatus: string) {
    super(`Barcode "${barcodeString}" cannot be scanned because it is already ${currentStatus}`)
  }
}

export class ItemAlreadyDispatchedError extends ConflictError {
  constructor(barcodeString: string) {
    super(`Item "${barcodeString}" has already been dispatched.`)
  }
}

export class ItemNotAvailableError extends ConflictError {
  constructor(barcodeString: string, currentStatus: string) {
    super(`Item "${barcodeString}" is not available for dispatch (Current status: ${currentStatus}).`)
  }
}

export class ItemDamagedError extends ConflictError {
  constructor(barcodeString: string) {
    super(`Item "${barcodeString}" is marked as DAMAGED and cannot be dispatched.`)
  }
}

export class ItemQuarantinedError extends ConflictError {
  constructor(barcodeString: string) {
    super(`Item "${barcodeString}" is in QUARANTINE status.`)
  }
}

// Strict FIFO Enforcement Domain Error
export class FifoViolationError extends ConflictError {
  readonly olderBatchNumber: string
  readonly attemptedBatchNumber: string

  constructor(attemptedBatchNumber: string, olderBatchNumber: string) {
    super(
      `FIFO Violation: Cannot dispatch from batch "${attemptedBatchNumber}" because an older batch "${olderBatchNumber}" still contains available stock.`
    )
    this.olderBatchNumber = olderBatchNumber
    this.attemptedBatchNumber = attemptedBatchNumber
  }
}

// Cycle Count Audit Errors
export class CycleCountNotFoundError extends NotFoundError {
  constructor(identifier: string | number) {
    super(`Cycle Count audit record not found: "${identifier}"`)
  }
}

export class CycleCountAlreadyClosedError extends ValidationError {
  constructor(countNumber: string) {
    super(`Cycle count audit "${countNumber}" has already been completed or cancelled.`)
  }
}

// User & Authentication Errors
export class UserNotFoundError extends NotFoundError {
  constructor(identifier: string | number) {
    super(`User not found: "${identifier}"`)
  }
}

export class InvalidCredentialsError extends UnauthorizedError {
  constructor() {
    super('Invalid credentials provided.')
  }
}
