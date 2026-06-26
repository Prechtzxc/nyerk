import { storage } from "@/lib/firebase"
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage"

const MAX_IMAGE_SIZE_BYTES = 2.5 * 1024 * 1024
const MAX_PANORAMA_SIZE_BYTES = 10 * 1024 * 1024

export function validateImageFile(file: File, isPanorama = false): string | null {
  const maxSize = isPanorama ? MAX_PANORAMA_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES
  if (!file.type.startsWith("image/")) return "Upload an image."
  if (file.size > maxSize) return isPanorama ? "Max 10MB." : "Max 2.5MB."
  return null
}

export async function uploadCMSImage(file: File, storagePath: string): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
  const fullPath = `cms/${storagePath}/${Date.now()}_${safeName}`
  const storageRef = ref(storage, fullPath)
  const snapshot = await uploadBytesResumable(storageRef, file)
  return getDownloadURL(snapshot.ref)
}

export async function deleteCMSImage(imageUrl: string): Promise<void> {
  if (!imageUrl || !imageUrl.startsWith("https://firebasestorage.googleapis.com")) return
  try {
    const storageRef = ref(storage, imageUrl)
    await deleteObject(storageRef)
  } catch {
    // silently ignore — file may already be deleted
  }
}

function isFirebaseStorageUrl(url: string): boolean {
  return url.startsWith("https://firebasestorage.googleapis.com")
}

export async function removeImage(value: string): Promise<string> {
  if (isFirebaseStorageUrl(value)) {
    await deleteCMSImage(value)
  }
  return ""
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
