import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AutomationTrigger, AutomationAction } from './create-automation.dto';

export class AutomationResponseDto {
  @ApiProperty({ description: 'ID da automação' })
  id: string;

  @ApiProperty({ description: 'Nome da automação' })
  name: string;

  @ApiProperty({ description: 'Descrição' })
  description: string;

  @ApiProperty({ description: 'Trigger', enum: AutomationTrigger })
  trigger: AutomationTrigger;

  @ApiProperty({ description: 'Ação', enum: AutomationAction })
  action: AutomationAction;

  @ApiPropertyOptional({ description: 'Condições' })
  conditions?: Record<string, unknown>;

  @ApiProperty({ description: 'Configuração da ação' })
  actionConfig: Record<string, unknown>;

  @ApiProperty({ description: 'Status ativo' })
  isActive: boolean;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;
}
