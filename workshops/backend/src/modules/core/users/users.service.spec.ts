import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../../../database/prisma.service';
import { CreateUserDto, UpdateUserDto, UserRole } from './dto';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;

  const mockTenantId = 'tenant-id';
  const mockUser = {
    id: 'user-id',
    tenantId: mockTenantId,
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedPassword',
    role: UserRole.TECHNICIAN,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);

    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'Password123',
      role: UserRole.TECHNICIAN,
      isActive: true,
    };

    it('deve criar um usuário com sucesso', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockUser);

      const result = await service.create(mockTenantId, createUserDto);

      expect(result).toHaveProperty('id', 'user-id');
      expect(result).toHaveProperty('email', 'test@example.com');
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: {
          tenantId_email: {
            tenantId: mockTenantId,
            email: 'test@example.com',
          },
        },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('Password123', 10);
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });

    it('deve lançar ConflictException se email já existe', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.create(mockTenantId, createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('deve normalizar email para lowercase', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockUser);

      const dtoWithUppercase = { ...createUserDto, email: 'TEST@EXAMPLE.COM' };
      await service.create(mockTenantId, dtoWithUppercase);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: {
          tenantId_email: {
            tenantId: mockTenantId,
            email: 'test@example.com',
          },
        },
      });
    });
  });

  describe('findAll', () => {
    it('deve retornar lista de usuários ativos', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([mockUser]);

      const result = await service.findAll(mockTenantId, false);

      expect(result).toHaveLength(1);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: mockTenantId,
          isActive: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('deve incluir usuários inativos quando solicitado', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([mockUser]);

      await service.findAll(mockTenantId, true);

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: mockTenantId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });
  });

  describe('findOne', () => {
    it('deve retornar um usuário', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);

      const result = await service.findOne(mockTenantId, 'user-id');

      expect(result).toHaveProperty('id', 'user-id');
      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'user-id',
          tenantId: mockTenantId,
        },
      });
    });

    it('deve lançar NotFoundException se usuário não existe', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(mockTenantId, 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      name: 'Updated Name',
    };

    it('deve atualizar um usuário com sucesso', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        name: 'Updated Name',
      });

      const result = await service.update(
        mockTenantId,
        'user-id',
        updateUserDto,
      );

      expect(result.name).toBe('Updated Name');
      expect(mockPrismaService.user.update).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException se usuário não existe', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        service.update(mockTenantId, 'non-existent', updateUserDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve hash da senha se senha for fornecida', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(mockUser);

      const dtoWithPassword = { ...updateUserDto, password: 'NewPassword123' };
      await service.update(mockTenantId, 'user-id', dtoWithPassword);

      expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword123', 10);
    });

    it('deve lançar ConflictException se novo email já existe', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        id: 'other-user-id',
      });

      const dtoWithEmail = { ...updateUserDto, email: 'other@example.com' };
      await expect(
        service.update(mockTenantId, 'user-id', dtoWithEmail),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('deve fazer soft delete (marcar como inativo)', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      await service.remove(mockTenantId, 'user-id');

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        data: { isActive: false },
      });
    });

    it('deve lançar NotFoundException se usuário não existe', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        service.remove(mockTenantId, 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
