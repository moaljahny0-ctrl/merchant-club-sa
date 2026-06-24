import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'

const COOKIE_NAME = 'mc_customer_session'
const secret = () => {
  if (!process.env.JWT_SECRET) throw new Error('[auth] JWT_SECRET is not configured')
  return new TextEncoder().encode(process.env.JWT_SECRET)
}

export type CustomerSession = {
  id: string
  email: string
  full_name: string
  phone: string | null
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createSession(customer: CustomerSession): Promise<void> {
  const token = await new SignJWT({ ...customer })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .setIssuedAt()
    .sign(secret())

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, secret())
    const { id, email, full_name, phone } = payload as Record<string, unknown>
    if (typeof id !== 'string' || typeof email !== 'string' || typeof full_name !== 'string') return null
    return { id, email, full_name, phone: typeof phone === 'string' ? phone : null }
  } catch {
    return null
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
