import { deleteLocalImageUpload, saveImageUpload as saveLocalImageUpload } from "@/lib/storage/local";
import { deleteR2ImageUpload, isR2Configured, saveR2ImageUpload } from "@/lib/storage/r2";

function shouldUseR2() {
  if (process.env.UPLOAD_DRIVER === "local") return false;
  if (process.env.UPLOAD_DRIVER === "r2") return true;
  return isR2Configured();
}

export async function saveImageUpload(file: File, providedBytes?: Buffer) {
  if (shouldUseR2()) return saveR2ImageUpload(file, providedBytes);
  if (process.env.NODE_ENV === "production") throw new Error("生产环境必须配置 Cloudflare R2 上传存储。");
  return saveLocalImageUpload(file, providedBytes);
}

export async function deleteImageUpload(storageKey: string) {
  if (shouldUseR2()) {
    await deleteR2ImageUpload(storageKey);
    return;
  }
  await deleteLocalImageUpload(storageKey);
}