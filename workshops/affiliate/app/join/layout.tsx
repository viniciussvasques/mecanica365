import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Seja um Afiliado | Mecânica365",
    description: "Junte-se ao programa de afiliados Mecânica365 e ganhe comissões recorrentes de até 10% indicando nossa solução para oficinas mecânicas.",
    keywords: ['programa afiliados', 'ganhar comissões', 'indicar software', 'parceiro mecanica365'],
    openGraph: {
        title: "Seja um Afiliado Mecânica365",
        description: "Ganhe comissões recorrentes indicando nosso sistema para oficinas mecânicas.",
        type: "website",
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function JoinLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
