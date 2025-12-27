import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class AdminAutomationsService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.adminAutomation.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const automation = await this.prisma.adminAutomation.findUnique({
            where: { id },
        });

        if (!automation) {
            throw new NotFoundException('Automação não encontrada');
        }

        return automation;
    }

    async create(data: any) {
        return this.prisma.adminAutomation.create({ data });
    }

    async update(id: string, data: any) {
        await this.findOne(id);
        return this.prisma.adminAutomation.update({ where: { id }, data });
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.adminAutomation.delete({ where: { id } });
    }

    async execute(id: string) {
        const automation = await this.findOne(id);
        // Incrementar contador de execução
        await this.prisma.adminAutomation.update({
            where: { id },
            data: {
                executionCount: { increment: 1 },
                lastExecutedAt: new Date(),
            },
        });
        return { success: true, message: `Automação "${automation.name}" executada com sucesso` };
    }
}
