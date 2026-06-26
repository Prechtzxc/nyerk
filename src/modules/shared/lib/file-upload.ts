import { storage } from "@/lib/firebase"
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage"

export interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploadedAt: string
}

function makeStoragePath(bookingId: string, fileName: string) {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, "_")
  return `uploads/${bookingId}/${Date.now()}_${safe}`
}

export class FileUploadService {
  private static instance: FileUploadService

  static getInstance(): FileUploadService {
    if (!FileUploadService.instance) {
      FileUploadService.instance = new FileUploadService()
    }
    return FileUploadService.instance
  }

  async uploadFile(file: File, bookingId: string): Promise<UploadedFile> {
    this.validateFile(file)

    const fileId = `file-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
    const storagePath = makeStoragePath(bookingId, file.name)
    const storageRef = ref(storage, storagePath)

    const snapshot = await uploadBytesResumable(storageRef, file)
    const url = await getDownloadURL(snapshot.ref)

    const uploadedFile: UploadedFile = {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      url,
      uploadedAt: new Date().toISOString(),
    }

    return uploadedFile
  }

  private validateFile(file: File): void {
    const maxSize = 10 * 1024 * 1024
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "image/heic",
      "image/heif",
    ]

    if (file.size > maxSize) {
      throw new Error("File size must be less than 10MB")
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error("File type not supported. Please upload an image or PDF file.")
    }
  }

  async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      const storageRef = ref(storage, fileUrl)
      await deleteObject(storageRef)
      return true
    } catch {
      return false
    }
  }
}
