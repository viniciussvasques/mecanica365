import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class AdminIntegrationsService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.adminIntegration.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const integration = await this.prisma.adminIntegration.findUnique({
            where: { id },
        });

        if (!integration) {
            throw new NotFoundException('Integração não encontrada');
        }

        return integration;
    }

    async create(data: any) {
        return this.prisma.adminIntegration.create({ data });
    }

    async update(id: string, data: any) {
        await this.findOne(id);
        return this.prisma.adminIntegration.update({ where: { id }, data });
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.adminIntegration.delete({ where: { id } });
    }

    async test(id: string) {
        // Implementar lógica de teste similar ao IntegrationsService se necessário
        return { success: true, message: 'Teste de integração global simulado com sucesso' };
    }
}
