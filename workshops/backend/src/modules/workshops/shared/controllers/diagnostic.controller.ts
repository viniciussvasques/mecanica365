import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '@common/guards/tenant.guard';
import { TenantId } from '@common/decorators/tenant.decorator';
import {
  DiagnosticService,
  DiagnosticSuggestion,
} from '../services/diagnostic.service';
import { ProblemCategory } from '../enums/problem-category.enum';
import { IsArray, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class SuggestProblemsDto {
  @ApiProperty({
    description: 'Lista de sintomas relatados pelo cliente',
    example: ['ruído no freio', 'barulho ao frear'],
    type: [String],
  })
  @IsArray({ message: 'Sintomas deve ser um array' })
  @IsString({ each: true, message: 'Cada sintoma deve ser uma string' })
  symptoms: string[];

  @ApiProperty({
    description: 'Categoria opcional para filtrar problemas',
    enum: ProblemCategory,
    required: false,
  })
  @IsEnum(ProblemCategory, { message: 'Categoria inválida' })
  @IsOptional()
  category?: ProblemCategory;
}

@ApiTags('Diagnóstico')
@ApiBearerAuth()
@Controller('diagnostic')
@UseGuards(JwtAuthGuard, TenantGuard)
export class DiagnosticController {
  constructor(private readonly diagnosticService: DiagnosticService) {}

  @Post('suggest')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sugerir problemas baseado em sintomas',
    description:
      'Recebe sintomas relatados pelo cliente e retorna uma lista de problemas sugeridos ordenados por relevância',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de problemas sugeridos',
    type: [Object],
  })
  async suggestProblems(
    @TenantId() tenantId: string,
    @Body() dto: SuggestProblemsDto,
  ): Promise<DiagnosticSuggestion[]> {
    return this.diagnosticService.suggestProblems(dto.symptoms, dto.category);
  }

  @Get('problems')
  @ApiOperation({
    summary: 'Listar problemas por categoria',
    description:
      'Retorna todos os problemas ativos de uma categoria específica',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de problemas da categoria',
    type: [Object],
  })
  async getProblemsByCategory(
    @TenantId() tenantId: string,
    @Query('category') category: ProblemCategory,
  ): Promise<DiagnosticSuggestion[]> {
    return this.diagnosticService.getProblemsByCategory(category);
  }
}
