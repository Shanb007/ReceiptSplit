import { isLocalMode } from './mode'

export interface ImageStore {
  upload(fileBuffer: Buffer, fileName: string): Promise<string | null>
  delete(imageUrl: string): Promise<void>
}

class CloudinaryImageStore implements ImageStore {
  async upload(fileBuffer: Buffer, fileName: string): Promise<string> {
    const { uploadReceiptImage } = await import('./cloudinary')
    return uploadReceiptImage(fileBuffer, fileName)
  }

  async delete(imageUrl: string): Promise<void> {
    const { deleteReceiptImage } = await import('./cloudinary')
    return deleteReceiptImage(imageUrl)
  }
}

class LocalImageStore implements ImageStore {
  async upload(): Promise<null> {
    return null
  }

  async delete(): Promise<void> {
    // no-op
  }
}

export const imageStore: ImageStore = isLocalMode
  ? new LocalImageStore()
  : new CloudinaryImageStore()
