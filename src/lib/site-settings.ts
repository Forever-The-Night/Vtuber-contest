import { prisma } from "@/lib/db";

const GLOBAL_SETTING_ID = "global";

function envInviteRequired() {
  return process.env.INVITE_REQUIRED === "true";
}

export async function getInviteRequiredSetting() {
  if (process.env.NODE_ENV === "test") {
    return envInviteRequired();
  }

  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { id: GLOBAL_SETTING_ID },
      select: { inviteRequired: true },
    });
    return setting?.inviteRequired ?? envInviteRequired();
  } catch {
    return envInviteRequired();
  }
}

export async function setInviteRequiredSetting(inviteRequired: boolean) {
  return prisma.siteSetting.upsert({
    where: { id: GLOBAL_SETTING_ID },
    update: { inviteRequired },
    create: { id: GLOBAL_SETTING_ID, inviteRequired },
  });
}
