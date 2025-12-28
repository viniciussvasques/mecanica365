import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { Request } from 'express';

@Injectable()
export class PublicAffiliatesService {
    constructor(private prisma: PrismaService) { }

    async trackVisit(code: string, req: Request) {
        const link = await this.prisma.affiliateLink.findUnique({
            where: { code },
            include: { product: true },
        });

        if (!link) {
            throw new NotFoundException('Invalid affiliate link');
        }

        // Registrar a visita de forma assíncrona (não bloquear o redirecionamento)
        this.prisma.affiliateVisit.create({
            data: {
                linkId: link.id,
                affiliateId: link.affiliateId,
                ip: req.ip,
                userAgent: req.get('user-agent'),
                referrer: req.get('referrer') || req.get('referer'),
            },
        }).catch(err => {
            console.error('Error tracking affiliate visit:', err);
        });

        return link.targetUrl;
    }
}
