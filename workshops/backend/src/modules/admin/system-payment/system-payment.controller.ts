import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CreateSystemPaymentDto } from './dto/create-system-payment.dto';
import { UpdateSystemPaymentDto } from './dto/update-system-payment.dto';
import { SystemPaymentService } from './system-payment.service';

@ApiTags('Admin - System Payment')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin/system-payment')
export class SystemPaymentController {
  constructor(private readonly systemPaymentService: SystemPaymentService) {}

  @Get()
  @ApiOperation({ summary: 'Listar gateways de pagamento globais' })
  findAll() {
    return this.systemPaymentService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes de um gateway' })
  findOne(@Param('id') id: string) {
    return this.systemPaymentService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo gateway de pagamento' })
  create(@Body() createDto: CreateSystemPaymentDto) {
    return this.systemPaymentService.create(createDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar gateway de pagamento' })
  update(@Param('id') id: string, @Body() updateDto: UpdateSystemPaymentDto) {
    return this.systemPaymentService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover gateway de pagamento' })
  remove(@Param('id') id: string) {
    return this.systemPaymentService.remove(id);
  }

  @Patch(':id/default')
  @ApiOperation({ summary: 'Definir gateway como padrão' })
  setDefault(@Param('id') id: string) {
    return this.systemPaymentService.setDefault(id);
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Testar conexão com o gateway' })
  test(@Param('id') id: string) {
    return this.systemPaymentService.testConnection(id);
  }
}
