'use client'

// ====================================================================
// Presentation Layer: FIFO Violation Domain Alert Dialog
// Strictly prevents worker dispatching from newer batch before older batch
// ====================================================================

import { Button, Icon } from '@/components/ui'

interface FifoAlertModalProps {
  attemptedBatch: string
  olderBatch: string
  barcodeString: string
  canOverride?: boolean
  onOverride: () => void
  onClose: () => void
}

export function FifoAlertModal({
  attemptedBatch,
  olderBatch,
  barcodeString,
  canOverride = false,
  onOverride,
  onClose,
}: FifoAlertModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-2xl border-2 border-error/50 bg-surface p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-error-soft text-error">
            <Icon name="alert" className="size-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-ink">Strict FIFO Rule Violation</h3>
            <p className="text-xs text-muted mt-0.5">Outbound dispatch was blocked by Enterprise Business Rules.</p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-error/20 bg-error-soft/30 p-3.5 space-y-2">
          <div className="text-xs font-semibold text-error">
            Cannot dispatch item <span className="font-mono underline">{barcodeString}</span>
          </div>
          <p className="text-[12px] leading-relaxed text-ink/80">
            This item belongs to batch <span className="font-mono font-bold text-ink">{attemptedBatch}</span>.
            However, an older inbound batch <span className="font-mono font-bold text-error">{olderBatch}</span> still
            has active, undispatched inventory in the warehouse.
          </p>
        </div>

        <div className="mt-4 rounded-xl border border-line bg-bg p-3 text-xs text-muted">
          <span className="font-bold text-ink">Standard Operating Procedure:</span> Please return this sack to its bin
          and dispatch stock from older batch <span className="font-mono font-semibold text-primary">{olderBatch}</span>{' '}
          to ensure proper stock rotation.
        </div>

        <div className="mt-5 flex items-center justify-end gap-2 pt-2 border-t border-line">
          <Button variant="filled" onClick={onClose} className="text-xs">
            Acknowledge & Abort
          </Button>

          {canOverride && (
            <Button
              variant="outlined"
              onClick={onOverride}
              className="text-xs border-error text-error hover:bg-error-soft"
            >
              Manager Override
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
