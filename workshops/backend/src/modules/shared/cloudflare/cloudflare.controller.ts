import { Controller, Get, Post, Delete, Param, Body, Logger, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CloudflareService } from './cloudflare.service';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('Cloudflare')
@Controller('cloudflare')
export class CloudflareController {
  private readonly logger = new Logger(CloudflareController.name);

  constructor(private readonly cloudflareService: CloudflareService) {}

  @Get('zone/status')
  @Public()
  @ApiOperation({ summary: 'Verificar status da zona Cloudflare' })
  @ApiResponse({ status: 200, description: 'Status da zona retornado com sucesso' })
  async getZoneStatus() {
    return this.cloudflareService.getZoneStatus();
  }

  @Get('dns-records')
  @Public()
  @ApiOperation({ summary: 'Listar todos os registros DNS' })
  @ApiResponse({ status: 200, description: 'Lista de registros DNS retornada' })
  async listDNSRecords() {
    return this.cloudflareService.listDNSRecords();
  }

  @Post('dns-records/:subdomain')
  @Public()
  @ApiOperation({ summary: 'Criar registro DNS para subdomain' })
  @ApiResponse({ status: 201, description: 'Registro DNS criado com sucesso' })
  async createDNSRecord(@Param('subdomain') subdomain: string) {
    const success = await this.cloudflareService.createTenantSubdomain(subdomain);

    if (success) {
      return {
        success: true,
        message: `Subdomínio ${subdomain} criado com sucesso`,
        domain: `${subdomain}.mecanica365.com`
      };
    } else {
      return {
        success: false,
        message: `Falha ao criar subdomínio ${subdomain}`
      };
    }
  }

  @Delete('dns-records/:subdomain')
  @Public()
  @ApiOperation({ summary: 'Remover registro DNS de subdomain' })
  @ApiResponse({ status: 200, description: 'Registro DNS removido com sucesso' })
  async deleteDNSRecord(@Param('subdomain') subdomain: string) {
    const success = await this.cloudflareService.deleteTenantSubdomain(subdomain);

    if (success) {
      return {
        success: true,
        message: `Subdomínio ${subdomain} removido com sucesso`
      };
    } else {
      return {
        success: false,
        message: `Falha ao remover subdomínio ${subdomain}`
      };
    }
  }

  @Get('dns-records/:subdomain/available')
  @Public()
  @ApiOperation({ summary: 'Verificar se domínio está disponível' })
  @ApiResponse({ status: 200, description: 'Disponibilidade do domínio verificada' })
  async checkDomainAvailability(@Param('subdomain') subdomain: string) {
    const available = await this.cloudflareService.isDomainAvailable(subdomain);

    return {
      subdomain,
      available,
      fullDomain: `${subdomain}.mecanica365.com`
    };
  }

  @Post('test-connection')
  @Public()
  @ApiOperation({ summary: 'Testar conexão com Cloudflare API' })
  @ApiResponse({ status: 200, description: 'Conexão testada com sucesso' })
  async testConnection(@Headers('host') host?: string) {
    try {
      const zoneStatus = await this.cloudflareService.getZoneStatus();

      return {
        success: true,
        message: 'Conexão com Cloudflare API estabelecida',
        zone: zoneStatus
      };
    } catch (error) {
      return {
        success: false,
        message: 'Falha na conexão com Cloudflare API',
        error: error.message
      };
    }
  }
}
