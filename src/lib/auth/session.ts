import { Role } from "@prisma/client";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

const cookieName = "vtuber_contest_session";
const sessionMaxAge = 60 * 60 * 24 * 7;

export type SessionUser = {
  id: string;
  qq: string;
  nickname: string;
  avatarUrl: string | null;
  role: Role;
};

function getSecretKey() {
  return new TextEncoder().encode(
    process.env.AUTH_SECRET ?? "dev-only-change-before-deploy-vtuber-ai-contest",
  );
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ avatarUrl: user.avatarUrl, nickname: user.nickname, qq: user.qq, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(cookieName, token, {
    httpOnly: true,
    maxAge: sessionMaxAge,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (!payload.sub) {
      return null;
    }

    if (
      typeof payload.qq === "string" &&
      typeof payload.nickname === "string" &&
      (typeof payload.avatarUrl === "string" || payload.avatarUrl === null || typeof payload.avatarUrl === "undefined") &&
      (payload.role === Role.ADMIN || payload.role === Role.USER)
    ) {
      return {
        avatarUrl: typeof payload.avatarUrl === "string" ? payload.avatarUrl : null,
        id: payload.sub,
        nickname: payload.nickname,
        qq: payload.qq,
        role: payload.role,
      };
    }

    return prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        qq: true,
        nickname: true,
        avatarUrl: true,
        role: true,
      },
    });
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== Role.ADMIN) {
    redirect("/");
  }
  return user;
}