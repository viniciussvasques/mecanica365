import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ClientLayout } from '@/components/ClientLayout'
import { NotificationProvider } from '@/components/NotificationProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Mecânica365 - ERP para Oficinas',
  description: 'Sistema completo de gestão para oficinas mecânicas',
  icons: {
    icon: '/favicon.svg',
  },
}

// Força renderização dinâmica para evitar pré-render estático de páginas que usam search params
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <NotificationProvider>
          <ClientLayout>{children}</ClientLayout>
        </NotificationProvider>
      </body>
    </html>
  )
}

