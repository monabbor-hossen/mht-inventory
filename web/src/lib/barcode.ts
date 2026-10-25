// ====================================================================
// Barcode & TSC Thermal Printer Utility
// Zero-dependency Code 128 SVG generator and TSPL/ZPL command generator
// ====================================================================

/**
 * Standard Code 128B pattern table for numbers, uppercase and lowercase ASCII
 */
const CODE128_PATTERNS: string[] = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112',
]

/**
 * Encodes text into Code 128B pattern sequence
 */
export function encodeCode128B(text: string): string {
  const START_B = 104
  const STOP = 106

  const charCodes: number[] = [START_B]
  let checksum = START_B

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i) - 32
    if (code >= 0 && code <= 95) {
      charCodes.push(code)
      checksum += code * (i + 1)
    }
  }

  const checkDigit = checksum % 103
  charCodes.push(checkDigit)
  charCodes.push(STOP)

  // Convert codes to bar/space width pattern
  return charCodes.map((c) => CODE128_PATTERNS[c] || '').join('')
}

/**
 * Generates an SVG string representation of the barcode
 */
export function generateBarcodeSvg(text: string, height = 60, barWidth = 2): string {
  const pattern = encodeCode128B(text)
  let svgPaths = ''
  let currentX = 10
  let isBar = true

  for (let i = 0; i < pattern.length; i++) {
    const width = parseInt(pattern[i], 10) * barWidth
    if (isBar) {
      svgPaths += `<rect x="${currentX}" y="0" width="${width}" height="${height}" fill="#000000" />`
    }
    currentX += width
    isBar = !isBar
  }

  const totalWidth = currentX + 10
  return `
    <svg viewBox="0 0 ${totalWidth} ${height + 22}" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto max-w-[280px]">
      ${svgPaths}
      <text x="${totalWidth / 2}" y="${height + 16}" font-family="monospace" font-size="12" font-weight="600" text-anchor="middle" fill="#1E293B">${text}</text>
    </svg>
  `
}

/**
 * Generates TSPL command for direct network/USB printing to TSC Thermal Printers
 * (e.g. TSC TE244, DA200, TTP-244 Pro)
 */
export function generateTscCommand(barcodeString: string, batchNumber: string, category: string): string {
  return `
SIZE 75 mm, 50 mm
GAP 2 mm, 0 mm
DIRECTION 1
CLS
BOX 20,20,580,380,3
TEXT 40,35,"3",0,1,1,"MHT WAREHOUSE SYSTEM"
TEXT 40,70,"2",0,1,1,"BATCH: ${batchNumber} | CAT: ${category}"
BARCODE 40,110,"128",90,1,0,2,3,"${barcodeString}"
TEXT 40,240,"3",0,1,1,"${barcodeString}"
TEXT 40,290,"2",0,1,1,"NET WT: 25 KG | SACK ITEM"
TEXT 40,330,"1",0,1,1,"DATE: ${new Date().toLocaleDateString('en-GB')} | TSC THERMAL READY"
PRINT 1,1
`.trim()
}
