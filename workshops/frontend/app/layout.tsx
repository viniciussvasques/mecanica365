import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ClientLayout } from '@/components/ClientLayout'
import { NotificationProvider } from '@/components/NotificationProvider'
import { ToastProvider } from '@/components/ui/Toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://mecanica365.com'),
  title: {
    default: 'Mecânica365 - Sistema Completo de Gestão para Oficinas Mecânicas',
    template: '%s | Mecânica365'
  },
  description: 'Sistema completo de gestão para oficinas mecânicas. Controle de ROs, estoque, clientes, agendamentos e muito mais. Aumente sua produtividade em até 40%.',
  keywords: ['sistema para oficina', 'gestão oficina mecânica', 'ERP oficina', 'ordem de serviço', 'controle estoque peças', 'mecanica365', 'software oficina'],
  authors: [{ name: 'INNEXAR LLC' }],
  creator: 'INNEXAR LLC',
  publisher: 'INNEXAR LLC',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://mecanica365.com',
    title: 'Mecânica365 - Sistema Completo de Gestão para Oficinas',
    description: 'Sistema completo de gestão para oficinas mecânicas. Controle de ROs, estoque, clientes, agendamentos e muito mais. Aumente sua produtividade em até 40%.',
    siteName: 'Mecânica365',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'Mecânica365 - Sistema de Gestão para Oficinas',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mecânica365 - Sistema de Gestão para Oficinas',
    description: 'Sistema completo de gestão para oficinas mecânicas. Aumente sua produtividade em até 40%.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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
          <ToastProvider>
            <ClientLayout>{children}</ClientLayout>
          </ToastProvider>
        </NotificationProvider>
      </body>
    </html>
  )
}

