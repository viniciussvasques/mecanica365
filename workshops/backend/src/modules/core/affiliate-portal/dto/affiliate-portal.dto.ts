import { IsString, IsOptional, IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAffiliateProfileDto {
    @ApiPropertyOptional({ description: 'Nome do afiliado' })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({ description: 'Chave PIX para recebimento' })
    @IsOptional()
    @IsString()
    pixKey?: string;
}

export class AffiliateDashboardStatsDto {
    @ApiProperty({ description: 'Comissão total aprovada' })
    totalCommissions: number;

    @ApiProperty({ description: 'Número total de cliques' })
    totalVisits: number;

    @ApiProperty({ description: 'Número total de conversões' })
    totalConversions: number;

    @ApiProperty({ description: 'Taxa de conversão em porcentagem' })
    conversionRate: number;
}
