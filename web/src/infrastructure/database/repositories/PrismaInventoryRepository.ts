// ====================================================================
// Infrastructure Layer: Combined Prisma Inventory Repository (Adapter)
// ====================================================================

import { PrismaBatchRepository } from './PrismaBatchRepository'
import { PrismaBarcodeRepository } from './PrismaBarcodeRepository'

export class PrismaInventoryRepository {
  public readonly batchRepo = new PrismaBatchRepository()
  public readonly barcodeRepo = new PrismaBarcodeRepository()
}
