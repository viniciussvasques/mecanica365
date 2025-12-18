import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AdminUsersService } from './admin-users.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { ResetAdminPasswordDto } from './dto/reset-admin-password.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { UpdateAdminUserStatusDto } from './dto/update-admin-user-status.dto';

@ApiTags('Admin - Users')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar usuários administrativos' })
  findAll() {
    return this.adminUsersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter usuário administrativo por ID' })
  findOne(@Param('id') id: string) {
    return this.adminUsersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo usuário administrativo' })
  create(@Body() createDto: CreateAdminUserDto) {
    return this.adminUsersService.create(createDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar dados do usuário administrativo' })
  update(@Param('id') id: string, @Body() updateDto: UpdateAdminUserDto) {
    return this.adminUsersService.update(id, updateDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Ativar ou desativar usuário administrativo' })
  updateStatus(
    @Param('id') id: string,
    @Body() statusDto: UpdateAdminUserStatusDto,
  ) {
    return this.adminUsersService.updateStatus(id, statusDto);
  }

  @Patch(':id/reset-password')
  @ApiOperation({ summary: 'Resetar senha do usuário administrativo' })
  resetPassword(
    @Param('id') id: string,
    @Body() resetDto: ResetAdminPasswordDto,
  ) {
    return this.adminUsersService.resetPassword(id, resetDto);
  }
}
