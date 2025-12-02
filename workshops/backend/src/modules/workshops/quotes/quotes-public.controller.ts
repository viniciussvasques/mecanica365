import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { QuotesService } from './quotes.service';
import { QuoteResponseDto } from './dto';

@ApiTags('Quotes Public')
@Controller('public/quotes')
export class QuotesPublicController {
  constructor(private readonly quotesService: QuotesService) {}

  @Get('view')
  @ApiOperation({ summary: 'Visualizar orçamento por token público' })
  @ApiQuery({ name: 'token', description: 'Token público do orçamento' })
  @ApiResponse({
    status: 200,
    description: 'Orçamento encontrado',
    type: QuoteResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Token inválido ou expirado' })
  async viewByToken(@Query('token') token: string): Promise<QuoteResponseDto> {
    return this.quotesService.findByPublicToken(token);
  }

  @Post('approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aprovar orçamento via token público' })
  @ApiResponse({
    status: 200,
    description: 'Orçamento aprovado com sucesso',
    type: QuoteResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Token inválido ou expirado' })
  @ApiResponse({
    status: 400,
    description: 'Orçamento não pode ser aprovado',
  })
  async approveByToken(
    @Body() body: { token: string; customerSignature: string },
  ): Promise<QuoteResponseDto> {
    return this.quotesService.approveByPublicToken(
      body.token,
      body.customerSignature,
    );
  }

  @Post('reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rejeitar orçamento via token público' })
  @ApiResponse({
    status: 200,
    description: 'Orçamento rejeitado com sucesso',
    type: QuoteResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Token inválido ou expirado' })
  @ApiResponse({
    status: 400,
    description: 'Orçamento não pode ser rejeitado',
  })
  async rejectByToken(
    @Body() body: { token: string; reason?: string },
  ): Promise<QuoteResponseDto> {
    return this.quotesService.rejectByPublicToken(body.token, body.reason);
  }
}
