const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const products = [
        {
            code: 'mecanica365',
            name: 'Mecanica365',
            description: 'Sistema completo para gestão de oficinas mecânicas.',
            baseUrl: 'https://mecanica365.com',
            isActive: true,
        },
        {
            code: 'crm_hub',
            name: 'CRM Hub',
            description: 'Gestão de relacionamento com o cliente e vendas.',
            baseUrl: 'https://crmhub.com',
            isActive: true,
        }
    ];

    for (const product of products) {
        await prisma.saaSProduct.upsert({
            where: { code: product.code },
            update: product,
            create: product,
        });
    }

    console.log('Seed completed: SaaS Products created.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
