import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function uploadReceiptImage(
  fileBuffer: Buffer,
  fileName: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'receiptsplit',
        resource_type: 'image',
        public_id: `receipt_${Date.now()}_${fileName.replace(/\.[^.]+$/, '')}`,
        transformation: [
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) {
          reject(new Error(`Cloudinary upload failed: ${error.message}`))
        } else if (result) {
          resolve(result.secure_url)
        } else {
          reject(new Error('Cloudinary upload returned no result'))
        }
      }
    )

    uploadStream.end(fileBuffer)
  })
}

/**
 * Extract the Cloudinary public_id from a secure URL.
 * URL format: https://res.cloudinary.com/{cloud}/image/upload/v{ver}/{folder}/{public_id}.{ext}
 */
function extractPublicId(imageUrl: string): string | null {
  try {
    const url = new URL(imageUrl)
    // Path: /image/upload/v1234567890/receiptsplit/receipt_xxx.jpg
    const parts = url.pathname.split('/upload/')
    if (parts.length < 2) return null
    // Remove the version prefix (v1234567890/) and file extension
    const afterUpload = parts[1].replace(/^v\d+\//, '')
    const publicId = afterUpload.replace(/\.[^.]+$/, '')
    return publicId || null
  } catch {
    return null
  }
}

/**
 * Delete a receipt image from Cloudinary by its URL.
 * Silently ignores errors (best-effort cleanup).
 */
export async function deleteReceiptImage(imageUrl: string): Promise<void> {
  const publicId = extractPublicId(imageUrl)
  if (!publicId) return

  try {
    await cloudinary.uploader.destroy(publicId)
  } catch (err) {
    console.error('Failed to delete Cloudinary image:', err)
  }
}
