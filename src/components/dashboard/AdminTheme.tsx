'use client'

import { createContext, useContext } from 'react'

export const AdminThemeCtx = createContext<{ isDark: boolean }>({ isDark: true })

export function useAdminTheme() {
  return useContext(AdminThemeCtx)
}
