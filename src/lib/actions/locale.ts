'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function setDashboardLocale(locale: 'en' | 'ar'): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set('dashboard_locale', locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })
  revalidatePath('/dashboard', 'layout')
}
