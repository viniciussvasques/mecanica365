import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateAffiliateDto, UpdateAffiliateDto, CreateAffiliateLinkDto } from './dto/affiliates.dto';

@Injectable()
export class AdminAffiliatesService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.affiliate.findMany({
            include: {
                links: {
                    include: {
                        product: true,
                    },
                },
                _count: {
                    select: {
                        visits: true,
                        commissions: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const affiliate = await this.prisma.affiliate.findUnique({
            where: { id },
            include: {
                links: {
                    include: {
                        product: true,
                    },
                },
                commissions: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!affiliate) {
            throw new NotFoundException(`Affiliate with ID ${id} not found`);
        }

        return affiliate;
    }

    async create(dto: CreateAffiliateDto) {
        const existing = await this.prisma.affiliate.findUnique({
            where: { email: dto.email },
        });

        if (existing) {
            throw new ConflictException('Affiliate with this email already exists');
        }

        return this.prisma.affiliate.create({
            data: dto,
        });
    }

    async update(id: string, dto: UpdateAffiliateDto) {
        await this.findOne(id);

        return this.prisma.affiliate.update({
            where: { id },
            data: dto,
        });
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.affiliate.delete({ where: { id } });
    }

    // Links management
    async createLink(affiliateId: string, dto: CreateAffiliateLinkDto) {
        await this.findOne(affiliateId);

        const existingLink = await this.prisma.affiliateLink.findUnique({
            where: { code: dto.code },
        });

        if (existingLink) {
            throw new ConflictException('Link code already in use');
        }

        return this.prisma.affiliateLink.create({
            data: {
                ...dto,
                affiliateId,
            },
        });
    }

    async getMetrics(id: string) {
        const affiliate = await this.findOne(id);

        const totalCommissions = await this.prisma.affiliateCommission.aggregate({
            where: { affiliateId: id, status: 'approved' },
            _sum: { amount: true },
        });

        const totalVisits = await this.prisma.affiliateVisit.count({
            where: { affiliateId: id },
        });

        return {
            totalCommissions: totalCommissions._sum.amount || 0,
            totalVisits,
            linksCount: affiliate.links.length,
        };
    }

    // SaaS Products management (simplified for now)
    async findAllProducts() {
        return this.prisma.saasProduct.findMany({
            where: { isActive: true },
        });
    }
}
