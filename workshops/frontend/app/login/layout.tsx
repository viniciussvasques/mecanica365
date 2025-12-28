import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Login | Mecânica365',
    description: 'Acesse sua conta Mecânica365 e gerencie sua oficina mecânica de forma inteligente.',
    robots: {
        index: false, // Não indexar página de login
        follow: false,
    },
}

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
