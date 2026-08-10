import { prisma } from "@/lib/db";

export const GROUP_CONFIG_ID = "global";

export const defaultGroupConfig = {
  answer: null,
  body: null,
  enabled: true,
  qrCodeUrl: null,
  qrStorageKey: null,
  question: null,
  questionEnabled: false,
} as const;

export async function getGroupConfig() {
  try {
    const config = await prisma.groupConfig.findUnique({ where: { id: GROUP_CONFIG_ID } });
    return config;
  } catch {
    return null;
  }
}

export async function saveGroupConfig(data: {
  answer: string | null;
  body: string | null;
  enabled: boolean;
  qrCodeUrl: string | null;
  qrStorageKey: string | null;
  question: string | null;
  questionEnabled: boolean;
}) {
  return prisma.groupConfig.upsert({
    where: { id: GROUP_CONFIG_ID },
    update: data,
    create: { id: GROUP_CONFIG_ID, ...data },
  });
}
