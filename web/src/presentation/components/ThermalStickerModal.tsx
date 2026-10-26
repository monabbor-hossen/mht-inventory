'use client'

// ====================================================================
// Presentation Layer: Thermal Sticker Preview & Command Generator Modal
// Supports 1D (Code 128), 2D (QR, Data Matrix), TSC TSPL, and Zebra ZPL
// ====================================================================

import { useState, useEffect } from 'react'
import { Button, Icon } from '@/components/ui'

interface ThermalStickerModalProps {
  barcodeString: string
  onClose: () => void
  onToast: (msg: string, tone: 'success' | 'error' | 'warning') => void
}

export function ThermalStickerModal({
  barcodeString,
  onClose,
  onToast,
}: ThermalStickerModalProps) {
  const [format, setFormat] = useState<'code128' | 'qrcode' | 'datamatrix'>('code128')
  const [previewData, setPreviewData] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'preview' | 'tspl' | 'zpl'>('preview')

  const fetchPreview = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/inbound/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode_string: barcodeString, type: format }),
      })
      const json = await res.json()
      if (json.success) {
        setPreviewData(json.data)
      } else {
        onToast(json.error || 'Failed to render barcode', 'error')
      }
    } catch {
      onToast('Error generating thermal label', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (barcodeString) fetchPreview()
  }, [barcodeString, format])

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    onToast(`${label} copied to clipboard! Ready to send to thermal printer.`, 'success')
  }

  const handleBrowserPrint = () => {
    const printWindow = window.open('', '_blank', 'width=450,height=400')
    if (!printWindow) return
    printWindow.document.write(`
      <html>
        <head>
          <title>Thermal Sticker - ${barcodeString}</title>
          <style>
            @page { size: 75mm 50mm; margin: 0; }
            body { font-family: monospace; padding: 8px; margin: 0; font-size: 11px; text-align: center; }
            .box { border: 2px solid black; padding: 6px; box-sizing: border-box; height: 100%; border-radius: 4px; }
            .title { font-weight: bold; font-size: 13px; margin-bottom: 4px; }
            .meta { font-size: 10px; margin-bottom: 6px; }
            .barcode-svg svg { width: 100%; max-height: 85px; }
            .weight { font-weight: bold; margin-top: 4px; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="box">
            <div class="title">MHT ENTERPRISE WMS</div>
            <div class="meta">SKU: ${previewData?.meta?.sku ?? 'SKU'} | BATCH: ${previewData?.meta?.batchNumber ?? 'BATCH'}</div>
            <div class="barcode-svg">${previewData?.previewSvg ?? ''}</div>
            <div class="weight">NET WT: ${previewData?.meta?.unitWeight ?? 25} KG | ${previewData?.meta?.locationCode ?? 'DEFAULT'}</div>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div>
            <h3 className="text-base font-bold text-ink">Thermal Barcode Sticker Preview</h3>
            <p className="text-[11px] text-muted">Optimized 75mm x 50mm label for TSC & Zebra thermal printers</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink cursor-pointer">
            <Icon name="x" className="size-5" />
          </button>
        </div>

        {/* Format Selector Tabs */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex rounded-full bg-bg p-1 border border-line">
            <button
              onClick={() => setFormat('code128')}
              className={`rounded-full px-3 py-1 text-xs font-semibold cursor-pointer transition-colors ${
                format === 'code128' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              1D Code 128
            </button>
            <button
              onClick={() => setFormat('qrcode')}
              className={`rounded-full px-3 py-1 text-xs font-semibold cursor-pointer transition-colors ${
                format === 'qrcode' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              2D QR Code
            </button>
            <button
              onClick={() => setFormat('datamatrix')}
              className={`rounded-full px-3 py-1 text-xs font-semibold cursor-pointer transition-colors ${
                format === 'datamatrix' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              2D Data Matrix
            </button>
          </div>

          <div className="flex rounded-full bg-bg p-1 border border-line">
            <button
              onClick={() => setActiveTab('preview')}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                activeTab === 'preview' ? 'bg-surface text-primary shadow-xs' : 'text-muted'
              }`}
            >
              Visual
            </button>
            <button
              onClick={() => setActiveTab('tspl')}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                activeTab === 'tspl' ? 'bg-surface text-primary shadow-xs' : 'text-muted'
              }`}
            >
              TSPL
            </button>
            <button
              onClick={() => setActiveTab('zpl')}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                activeTab === 'zpl' ? 'bg-surface text-primary shadow-xs' : 'text-muted'
              }`}
            >
              ZPL
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="mt-4">
          {loading ? (
            <div className="flex h-52 items-center justify-center rounded-xl border border-line bg-bg">
              <span className="text-xs text-muted">Rendering barcode format...</span>
            </div>
          ) : activeTab === 'preview' ? (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-white p-4 text-center">
              <div className="w-full max-w-[340px] rounded border-2 border-black p-3 text-black">
                <div className="text-xs font-bold tracking-tight">MHT ENTERPRISE WMS</div>
                <div className="text-[10px] text-gray-600 mt-0.5">
                  SKU: {previewData?.meta?.sku} | BATCH: {previewData?.meta?.batchNumber}
                </div>
                <div className="text-[11px] font-semibold mt-1 truncate">{previewData?.meta?.productName}</div>
                <div
                  className="my-2 flex justify-center w-full max-h-[85px] overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: previewData?.previewSvg ?? '' }}
                />
                <div className="text-[10px] font-bold text-gray-800">
                  NET WT: {previewData?.meta?.unitWeight} KG | LOC: {previewData?.meta?.locationCode}
                </div>
              </div>
            </div>
          ) : activeTab === 'tspl' ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-medium text-muted">
                <span>TSC Thermal Printer Command (TSPL)</span>
                <button
                  onClick={() => copyToClipboard(previewData?.tsplCommand, 'TSPL Command')}
                  className="text-primary hover:underline font-semibold cursor-pointer"
                >
                  Copy TSPL
                </button>
              </div>
              <textarea
                readOnly
                rows={7}
                value={previewData?.tsplCommand ?? ''}
                className="w-full font-mono text-[11px] rounded-xl border border-line bg-bg p-3 text-ink outline-none"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-medium text-muted">
                <span>Zebra Thermal Printer Command (ZPL)</span>
                <button
                  onClick={() => copyToClipboard(previewData?.zplCommand, 'ZPL Command')}
                  className="text-primary hover:underline font-semibold cursor-pointer"
                >
                  Copy ZPL
                </button>
              </div>
              <textarea
                readOnly
                rows={7}
                value={previewData?.zplCommand ?? ''}
                className="w-full font-mono text-[11px] rounded-xl border border-line bg-bg p-3 text-ink outline-none"
              />
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="mt-5 flex items-center justify-between pt-3 border-t border-line">
          <Button variant="outlined" onClick={onClose} className="text-xs">
            Close
          </Button>
          <div className="flex gap-2">
            <Button
              variant="tonal"
              onClick={() => copyToClipboard(previewData?.tsplCommand, 'Raw TSPL')}
              className="text-xs flex items-center gap-1.5"
            >
              <Icon name="code" className="size-4" />
              <span>Copy TSPL</span>
            </Button>
            <Button
              variant="filled"
              onClick={handleBrowserPrint}
              className="text-xs flex items-center gap-1.5"
            >
              <Icon name="print" className="size-4" />
              <span>Print Thermal Sticker</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
