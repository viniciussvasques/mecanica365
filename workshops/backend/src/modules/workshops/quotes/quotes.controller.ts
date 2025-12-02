import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { QuotesService } from './quotes.service';
import {
  CreateQuoteDto,
  UpdateQuoteDto,
  QuoteResponseDto,
  QuoteFiltersDto,
  ApproveQuoteDto,
  CompleteDiagnosisDto,
  AssignMechanicDto,
} from './dto';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@core/auth/guards/roles.guard';
import { Roles } from '@core/auth/decorators/roles.decorator';
import { CurrentUser } from '@core/auth/decorators/current-user.decorator';
import { TenantId } from '@common/decorators/tenant.decorator';

@ApiTags('Quotes')
@ApiBearerAuth()
@Controller('quotes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('admin', 'manager', 'mechanic', 'receptionist')
  @ApiOperation({ summary: 'Criar um novo orçamento' })
  @ApiResponse({
    status: 201,
    description: 'Orçamento criado com sucesso',
    type: QuoteResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({
    status: 404,
    description: 'Cliente, veículo ou elevador não encontrado',
  })
  async create(
    @TenantId() tenantId: string,
    @Body() createQuoteDto: CreateQuoteDto,
  ): Promise<QuoteResponseDto> {
    return this.quotesService.create(tenantId, createQuoteDto);
  }

  @Get()
  @Roles('admin', 'manager', 'mechanic', 'receptionist')
  @ApiOperation({ summary: 'Listar orçamentos com filtros' })
  @ApiResponse({
    status: 200,
    description: 'Lista de orçamentos',
  })
  async findAll(
    @TenantId() tenantId: string,
    @Query() filters: QuoteFiltersDto,
  ) {
    return this.quotesService.findAll(tenantId, filters);
  }

  @Get(':id')
  @Roles('admin', 'manager', 'mechanic', 'receptionist')
  @ApiOperation({ summary: 'Buscar orçamento por ID' })
  @ApiParam({ name: 'id', description: 'ID do orçamento' })
  @ApiResponse({
    status: 200,
    description: 'Orçamento encontrado',
    type: QuoteResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  async findOne(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<QuoteResponseDto> {
    return this.quotesService.findOne(tenantId, id);
  }

  @Patch(':id')
  @Roles('admin', 'manager', 'mechanic', 'receptionist')
  @ApiOperation({ summary: 'Atualizar orçamento' })
  @ApiParam({ name: 'id', description: 'ID do orçamento' })
  @ApiResponse({
    status: 200,
    description: 'Orçamento atualizado com sucesso',
    type: QuoteResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  @ApiResponse({
    status: 400,
    description: 'Não é possível atualizar orçamento convertido',
  })
  async update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateQuoteDto: UpdateQuoteDto,
  ): Promise<QuoteResponseDto> {
    return this.quotesService.update(tenantId, id, updateQuoteDto);
  }

  @Post(':id/send-for-diagnosis')
  @Roles('admin', 'manager', 'receptionist')
  @ApiOperation({ summary: 'Enviar orçamento para diagnóstico do mecânico' })
  @ApiParam({ name: 'id', description: 'ID do orçamento' })
  @ApiResponse({
    status: 200,
    description: 'Orçamento enviado para diagnóstico com sucesso',
    type: QuoteResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  @ApiResponse({
    status: 400,
    description: 'Orçamento não está em rascunho ou faltam dados obrigatórios',
  })
  async sendForDiagnosis(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<QuoteResponseDto> {
    return this.quotesService.sendForDiagnosis(tenantId, id);
  }

  @Post(':id/assign-mechanic')
  @Roles('admin', 'manager', 'receptionist')
  @ApiOperation({ summary: 'Atribuir mecânico ao orçamento' })
  @ApiParam({ name: 'id', description: 'ID do orçamento' })
  @ApiResponse({
    status: 200,
    description: 'Mecânico atribuído com sucesso',
    type: QuoteResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Orçamento ou mecânico não encontrado',
  })
  @ApiResponse({
    status: 400,
    description: 'Orçamento já convertido ou mecânico inválido',
  })
  async assignMechanic(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() assignMechanicDto: AssignMechanicDto,
    @CurrentUser('id') currentUserId: string,
    @CurrentUser('role') currentUserRole: string,
  ): Promise<QuoteResponseDto> {
    return this.quotesService.assignMechanic(
      tenantId,
      id,
      assignMechanicDto,
      currentUserId,
      currentUserRole,
    );
  }

  @Post(':id/claim')
  @Roles('mechanic')
  @ApiOperation({ summary: 'Mecânico pegar orçamento disponível' })
  @ApiParam({ name: 'id', description: 'ID do orçamento' })
  @ApiResponse({
    status: 200,
    description: 'Orçamento atribuído ao mecânico com sucesso',
    type: QuoteResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  @ApiResponse({
    status: 400,
    description: 'Orçamento já tem mecânico atribuído ou não está disponível',
  })
  async claimQuote(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser('id') currentUserId: string,
  ): Promise<QuoteResponseDto> {
    return this.quotesService.claimQuote(tenantId, id, currentUserId);
  }

  @Post(':id/complete-diagnosis')
  @Roles('admin', 'manager', 'mechanic')
  @ApiOperation({ summary: 'Completar diagnóstico do mecânico' })
  @ApiParam({ name: 'id', description: 'ID do orçamento' })
  @ApiResponse({
    status: 200,
    description: 'Diagnóstico concluído com sucesso',
    type: QuoteResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  @ApiResponse({
    status: 400,
    description: 'Orçamento não está aguardando diagnóstico',
  })
  async completeDiagnosis(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() completeDiagnosisDto: CompleteDiagnosisDto,
  ): Promise<QuoteResponseDto> {
    return this.quotesService.completeDiagnosis(
      tenantId,
      id,
      completeDiagnosisDto,
    );
  }

  @Post(':id/send')
  @Roles('admin', 'manager', 'receptionist')
  @ApiOperation({ summary: 'Enviar orçamento ao cliente' })
  @ApiParam({ name: 'id', description: 'ID do orçamento' })
  @ApiResponse({
    status: 200,
    description: 'Orçamento enviado ao cliente com sucesso',
    type: QuoteResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  @ApiResponse({
    status: 400,
    description:
      'Orçamento não pode ser enviado (falta de itens ou status inválido)',
  })
  async sendToCustomer(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<QuoteResponseDto> {
    return this.quotesService.sendToCustomer(tenantId, id);
  }

  @Post(':id/approve')
  @Roles('admin', 'manager', 'receptionist')
  @ApiOperation({ summary: 'Aprovar orçamento e converter em Service Order' })
  @ApiParam({ name: 'id', description: 'ID do orçamento' })
  @ApiResponse({
    status: 200,
    description: 'Orçamento aprovado e Service Order criada',
  })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  @ApiResponse({
    status: 400,
    description: 'Orçamento já convertido, rejeitado ou expirado',
  })
  async approve(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() approveQuoteDto: ApproveQuoteDto,
  ) {
    return this.quotesService.approve(tenantId, id, approveQuoteDto);
  }

  @Get(':id/pdf')
  @Roles('admin', 'manager', 'mechanic', 'receptionist')
  @ApiOperation({ summary: 'Gerar PDF do orçamento' })
  @ApiParam({ name: 'id', description: 'ID do orçamento' })
  @ApiResponse({
    status: 200,
    description: 'PDF gerado com sucesso',
    content: {
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  async generatePdf(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const pdfBuffer: Buffer = await this.quotesService.generatePdf(
      tenantId,
      id,
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="orcamento-${id}.pdf"`,
    );
    res.send(pdfBuffer);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Remover orçamento' })
  @ApiParam({ name: 'id', description: 'ID do orçamento' })
  @ApiResponse({ status: 204, description: 'Orçamento removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  @ApiResponse({
    status: 400,
    description: 'Não é possível remover orçamento convertido',
  })
  async remove(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.quotesService.remove(tenantId, id);
  }

  @Post(':id/approve-manually')
  @Roles('admin', 'manager', 'receptionist')
  @ApiOperation({
    summary: 'Aprovar orçamento manualmente (após assinatura física)',
  })
  @ApiParam({ name: 'id', description: 'ID do orçamento' })
  @ApiResponse({
    status: 200,
    description: 'Orçamento aprovado manualmente e Service Order criada',
  })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  @ApiResponse({
    status: 400,
    description: 'Orçamento não pode ser aprovado manualmente',
  })
  async approveManually(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() body: { customerSignature?: string; notes?: string },
  ) {
    return this.quotesService.approveManually(
      tenantId,
      id,
      body.customerSignature,
      body.notes,
    );
  }

  @Post(':id/regenerate-token')
  @Roles('admin', 'manager', 'receptionist')
  @ApiOperation({ summary: 'Regenerar token público do orçamento' })
  @ApiParam({ name: 'id', description: 'ID do orçamento' })
  @ApiResponse({
    status: 200,
    description: 'Token público regenerado com sucesso',
    type: QuoteResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  async regenerateToken(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<QuoteResponseDto> {
    return this.quotesService.regeneratePublicToken(tenantId, id);
  }
}
