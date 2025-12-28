import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import { PublicAffiliatesService } from './public-affiliates.service';
import { Request, Response } from 'express';

@Controller('ref')
export class PublicAffiliatesController {
    constructor(private readonly affiliatesService: PublicAffiliatesService) { }

    @Get(':code')
    async redirect(@Param('code') code: string, @Req() req: Request, @Res() res: Response) {
        const targetUrl = await this.affiliatesService.trackVisit(code, req);

        // Opcional: Definir um cookie para rastreio persistente durante o registro
        res.cookie('affiliate_code', code, {
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dias
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        });

        return res.redirect(targetUrl);
    }
}
