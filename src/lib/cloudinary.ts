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
