import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AdminAffiliatesService } from './admin-affiliates.service';
import { CreateAffiliateDto, UpdateAffiliateDto, CreateAffiliateLinkDto } from './dto/affiliates.dto';
import { AdminGuard } from '../../../common/guards/admin.guard';

@Controller('admin/affiliates')
@UseGuards(AdminGuard)
export class AdminAffiliatesController {
    constructor(private readonly affiliatesService: AdminAffiliatesService) { }

    @Get()
    findAll() {
        return this.affiliatesService.findAll();
    }

    @Get('products')
    findAllProducts() {
        return this.affiliatesService.findAllProducts();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.affiliatesService.findOne(id);
    }

    @Post()
    create(@Body() dto: CreateAffiliateDto) {
        return this.affiliatesService.create(dto);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateAffiliateDto) {
        return this.affiliatesService.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.affiliatesService.remove(id);
    }

    @Post(':id/links')
    createLink(@Param('id') id: string, @Body() dto: CreateAffiliateLinkDto) {
        return this.affiliatesService.createLink(id, dto);
    }

    @Get(':id/metrics')
    getMetrics(@Param('id') id: string) {
        return this.affiliatesService.getMetrics(id);
    }
}
