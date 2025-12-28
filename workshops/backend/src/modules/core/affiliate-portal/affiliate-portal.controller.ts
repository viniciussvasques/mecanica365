import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AffiliatePortalService } from './affiliate-portal.service';
import { UpdateAffiliateProfileDto, AffiliateDashboardStatsDto } from './dto/affiliate-portal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Affiliate Portal')
@Controller('affiliate-portal')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class AffiliatePortalController {
    constructor(private readonly affiliatePortalService: AffiliatePortalService) { }

    @Get('stats')
    @ApiOperation({ summary: 'Obter estatísticas do dashboard do afiliado' })
    async getStats(@Req() req: any): Promise<AffiliateDashboardStatsDto> {
        const affiliate = await this.affiliatePortalService.getAffiliateByUserId(req.user.id);
        return this.affiliatePortalService.getStats(affiliate.id);
    }

    @Get('links')
    @ApiOperation({ summary: 'Listar links de afiliado do usuário' })
    async getLinks(@Req() req: any) {
        const affiliate = await this.affiliatePortalService.getAffiliateByUserId(req.user.id);
        return this.affiliatePortalService.getLinks(affiliate.id);
    }

    @Get('products')
    @ApiOperation({ summary: 'Listar produtos disponíveis para afiliação' })
    async getProducts() {
        return this.affiliatePortalService.getAvailableProducts();
    }

    @Get('profile')
    @ApiOperation({ summary: 'Obter perfil do afiliado' })
    async getProfile(@Req() req: any) {
        const affiliate = await this.affiliatePortalService.getAffiliateByUserId(req.user.id);
        return this.affiliatePortalService.getProfile(affiliate.id);
    }

    @Put('profile')
    @ApiOperation({ summary: 'Atualizar perfil/chave PIX do afiliado' })
    async updateProfile(@Req() req: any, @Body() dto: UpdateAffiliateProfileDto) {
        const affiliate = await this.affiliatePortalService.getAffiliateByUserId(req.user.id);
        return this.affiliatePortalService.updateProfile(affiliate.id, dto);
    }
}
