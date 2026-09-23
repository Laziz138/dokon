import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET
);

export async function createSession(userId: number, role: string) {
  return await new SignJWT({
    userId,
    role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);

    return {
      userId: Number(payload.userId),
      role: String(payload.role),
    };
  } catch {
    return null;
  }
}