import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, handleCorsOptions } from '@/lib/cors'
import fs from 'fs'
import path from 'path'

export async function OPTIONS() {
  return handleCorsOptions()
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''

    // 1. JSON base64 upload
    if (contentType.includes('application/json')) {
      const body = await request.json()
      const { image, filename = 'evidence.jpg', type = 'damage' } = body
      if (!image) return errorResponse('No image data provided', 400)

      const base64Data = image.replace(/^data:image\/\w+;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')

      const uploadDir = path.join(process.cwd(), 'public', 'uploads')
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }

      const safeName = `${type}_${Date.now()}_${path.basename(filename).replace(/[^a-zA-Z0-9.-]/g, '_')}`
      const filePath = path.join(uploadDir, safeName)
      fs.writeFileSync(filePath, buffer)

      const publicUrl = `/uploads/${safeName}`
      return jsonResponse({
        success: true,
        url: publicUrl,
        message: 'Image uploaded successfully',
      })
    }

    // 2. FormData multipart upload
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file') as File | null
      const type = (formData.get('type') as string) || 'evidence'

      if (!file) {
        return errorResponse('No file provided in form-data', 400)
      }

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const uploadDir = path.join(process.cwd(), 'public', 'uploads')
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }

      const safeName = `${type}_${Date.now()}_${path.basename(file.name).replace(/[^a-zA-Z0-9.-]/g, '_')}`
      const filePath = path.join(uploadDir, safeName)
      fs.writeFileSync(filePath, buffer)

      const publicUrl = `/uploads/${safeName}`
      return jsonResponse({
        success: true,
        url: publicUrl,
        message: 'File uploaded successfully',
      })
    }

    return errorResponse('Unsupported content type', 400)
  } catch (error: any) {
    return errorResponse('Failed to upload file', 500, error?.message)
  }
}
