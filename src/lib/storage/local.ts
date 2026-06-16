import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

const uploadRoot = path.join(/* turbopackIgnore: true */ process.cwd(), "public", "uploads");

function extensionFromFile(file: File) {
  const extension = path.extname(file.name).toLowerCase();
  if (extension) return extension;
  if (file.type === "image/png") return ".png";
  if (file.type === "image/webp") return ".webp";
  return ".jpg";
}

export async function saveImageUpload(file: File, providedBytes?: Buffer) {
  const bytes = providedBytes ?? Buffer.from(await file.arrayBuffer());
  const relativeDirectory = path.join("uploads", new Date().getFullYear().toString());
  const absoluteDirectory = path.join(uploadRoot, new Date().getFullYear().toString());
  await mkdir(absoluteDirectory, { recursive: true });

  const filename = `${randomUUID()}${extensionFromFile(file)}`;
  const absolutePath = path.join(absoluteDirectory, filename);
  await writeFile(absolutePath, bytes);

  return {
    buffer: bytes,
    imageUrl: `/${relativeDirectory.replaceAll("\\", "/")}/${filename}`,
    storageKey: path.join(relativeDirectory, filename).replaceAll("\\", "/"),
  };
}

export async function deleteLocalImageUpload(storageKey: string) {
  const relativeStorageKey = storageKey.replace(/^\/+/, "");
  const absolutePath = path.normalize(path.join(process.cwd(), "public", relativeStorageKey));
  if (!absolutePath.startsWith(uploadRoot)) return;
  await unlink(absolutePath).catch(() => undefined);
}