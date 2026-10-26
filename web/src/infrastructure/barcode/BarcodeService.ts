// ====================================================================
// Infrastructure Layer: Barcode & Thermal Printer Service
// Integrates bwip-js for 1D (Code 128) and 2D (QR, Data Matrix)
// Generates TSPL & ZPL commands for TSC and Zebra thermal printers
// ====================================================================

import bwipjs from 'bwip-js'

export interface ThermalStickerData {
  barcodeString: string
  batchNumber: string
  productName: string
  sku: string
  category: string
  unitWeight: number
  unitOfMeasure: string
  locationCode?: string
  dateString?: string
}

export class BarcodeService {
  /**
   * Generates an SVG string representation using bwip-js
   */
  static async generateSvg(text: string, bcid: 'code128' | 'qrcode' | 'datamatrix' = 'code128'): Promise<string> {
    try {
      const svg = await (bwipjs as any).toSVG({
        bcid,
        text,
        scale: 3,
        height: bcid === 'code128' ? 12 : 25,
        includetext: bcid === 'code128',
        textxalign: 'center',
      })
      return svg
    } catch {
      // Fallback clean SVG if bwip-js fails
      return `<svg viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg"><text x="10" y="30" font-family="monospace">${text}</text></svg>`
    }
  }

  /**
   * Generates TSPL thermal printer command (for TSC TE244, DA200, TTP-244 Pro, etc.)
   */
  static generateTsplCommand(data: ThermalStickerData): string {
    const date = data.dateString ?? new Date().toLocaleDateString('en-GB')
    return `
SIZE 75 mm, 50 mm
GAP 2 mm, 0 mm
DIRECTION 1
CLS
BOX 15,15,585,385,3
TEXT 35,30,"3",0,1,1,"MHT ENTERPRISE WMS"
TEXT 35,65,"2",0,1,1,"SKU: ${data.sku} | BATCH: ${data.batchNumber}"
TEXT 35,95,"2",0,1,1,"PROD: ${data.productName.substring(0, 24)}"
BARCODE 35,130,"128",80,1,0,2,3,"${data.barcodeString}"
TEXT 35,235,"3",0,1,1,"${data.barcodeString}"
TEXT 35,280,"2",0,1,1,"NET WT: ${data.unitWeight} ${data.unitOfMeasure.toUpperCase()} | ${data.category}"
TEXT 35,315,"2",0,1,1,"LOC: ${data.locationCode ?? 'DEFAULT-BIN'}"
TEXT 35,350,"1",0,1,1,"DATE: ${date} | TSPL THERMAL READY"
PRINT 1,1
`.trim()
  }

  /**
   * Generates ZPL thermal printer command (for Zebra ZD420, GX430t, etc.)
   */
  static generateZplCommand(data: ThermalStickerData): string {
    const date = data.dateString ?? new Date().toLocaleDateString('en-GB')
    return `
^XA
^PW600
^LL400
^FO20,20^GB560,360,3^FS
^FO40,40^A0N,30,30^FDMHT ENTERPRISE WMS^FS
^FO40,75^A0N,22,22^FDSKU: ${data.sku} | BATCH: ${data.batchNumber}^FS
^FO40,105^A0N,22,22^FDPROD: ${data.productName.substring(0, 24)}^FS
^FO40,140^BY2,3,70^BCN,70,Y,N,N^FD${data.barcodeString}^FS
^FO40,250^A0N,24,24^FDNET WT: ${data.unitWeight} ${data.unitOfMeasure.toUpperCase()} | ${data.category}^FS
^FO40,285^A0N,22,22^FDLOC: ${data.locationCode ?? 'DEFAULT-BIN'}^FS
^FO40,320^A0N,18,18^FDDATE: ${date} | ZPL THERMAL READY^FS
^XZ
`.trim()
  }
}
