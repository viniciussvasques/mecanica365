import { PartialType } from '@nestjs/swagger';
import { CreateServiceOrderDto } from './create-service-order.dto';
import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateServiceOrderDto extends PartialType(CreateServiceOrderDto) {
  @ApiProperty({
    description: 'ID do elevador para atualizar reserva',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString({ message: 'ID do elevador deve ser uma string' })
  @IsOptional()
  elevatorId?: string;
}

