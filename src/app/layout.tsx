import type { ReactNode } from 'react';

// Intentionally minimal — the [locale]/layout.tsx provides the full
// <html lang dir> structure required for i18n routing.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children as unknown as React.ReactElement;
}
