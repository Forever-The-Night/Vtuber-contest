import { randomUUID } from "crypto";
import path from "path";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for R2 storage.`);
  return value;
}

function extensionFromFile(file: File) {
  const extension = path.extname(file.name).toLowerCase();
  if (extension) return extension;
  if (file.type === "image/png") return ".png";
  if (file.type === "image/webp") return ".webp";
  return ".jpg";
}

function getR2Client() {
  const accountId = requireEnv("R2_ACCOUNT_ID");
  return new S3Client({
    credentials: {
      accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    },
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    region: "auto",
  });
}

export function isR2Configured() {
  return Boolean(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET && process.env.R2_PUBLIC_BASE_URL);
}

export async function saveR2ImageUpload(file: File, providedBytes?: Buffer) {
  const bytes = providedBytes ?? Buffer.from(await file.arrayBuffer());
  const key = `uploads/${new Date().getFullYear()}/${randomUUID()}${extensionFromFile(file)}`;
  const bucket = requireEnv("R2_BUCKET");
  await getR2Client().send(new PutObjectCommand({
    Body: bytes,
    Bucket: bucket,
    ContentType: file.type || "application/octet-stream",
    Key: key,
  }));

  return {
    buffer: bytes,
    imageUrl: `${requireEnv("R2_PUBLIC_BASE_URL").replace(/\/+$/, "")}/${key}`,
    storageKey: key,
  };
}

export async function deleteR2ImageUpload(storageKey: string) {
  await getR2Client().send(new DeleteObjectCommand({ Bucket: requireEnv("R2_BUCKET"), Key: storageKey.replace(/^\/+/, "") })).catch(() => undefined);
}