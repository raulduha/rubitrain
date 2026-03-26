import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CDUC Rugby',
  description: 'Plataforma de gestión deportiva',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
