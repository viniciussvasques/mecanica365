import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Criar Conta | Mecânica365',
    description: 'Crie sua conta gratuita no Mecânica365 e comece a transformar a gestão da sua oficina mecânica hoje mesmo.',
    keywords: ['criar conta oficina', 'cadastro mecanica365', 'teste grátis oficina', 'trial sistema oficina'],
    openGraph: {
        title: 'Criar Conta - Teste Grátis | Mecânica365',
        description: 'Comece grátis e transforme a gestão da sua oficina mecânica.',
        type: 'website',
    },
    robots: {
        index: true,
        follow: true,
    },
}

export default function RegisterLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
