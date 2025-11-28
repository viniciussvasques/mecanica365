import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);

    // Configurações padrão
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'jwt.expiresIn') return '15m';
      if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d';
      return null;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockUser = {
      id: 'user-id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'admin',
      tenantId: 'tenant-id',
      password: 'hashedPassword',
      isActive: true,
      tenant: {
        id: 'tenant-id',
        status: 'active',
      },
    };

    it('deve realizar login com sucesso', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      mockJwtService.sign.mockReturnValue('access-token');
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      const result = await service.login(loginDto, 'tenant-id');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(mockUser.email);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: {
          tenantId_email: {
            tenantId: 'tenant-id',
            email: 'test@example.com',
          },
        },
        include: {
          tenant: true,
        },
      });
    });

    it('deve lançar UnauthorizedException quando usuário não existe', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto, 'tenant-id')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('deve lançar UnauthorizedException quando usuário está inativo', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      await expect(service.login(loginDto, 'tenant-id')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('deve lançar UnauthorizedException quando tenant está inativo', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        tenant: { ...mockUser.tenant, status: 'suspended' },
      });

      await expect(service.login(loginDto, 'tenant-id')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('deve lançar UnauthorizedException quando senha está incorreta', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.login(loginDto, 'tenant-id')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('deve lançar BadRequestException quando email está vazio', async () => {
      const invalidDto = { ...loginDto, email: '' };

      await expect(service.login(invalidDto, 'tenant-id')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('logout', () => {
    it('deve realizar logout com sucesso', async () => {
      mockPrismaService.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      await service.logout('user-id', 'refresh-token');

      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalled();
    });

    it('deve lançar BadRequestException quando refresh token está vazio', async () => {
      await expect(service.logout('user-id', '')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('refreshToken', () => {
    const refreshTokenDto: RefreshTokenDto = {
      refreshToken: 'valid-refresh-token',
    };

    const mockRefreshToken = {
      id: 'token-id',
      userId: 'user-id',
      token: 'valid-refresh-token',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revokedAt: null,
    };

    const mockUser = {
      id: 'user-id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'admin',
      tenantId: 'tenant-id',
      isActive: true,
      tenant: {
        id: 'tenant-id',
        status: 'active',
      },
    };

    it('deve renovar token com sucesso', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(mockRefreshToken);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.refreshToken.updateMany.mockResolvedValue({ count: 1 });
      mockJwtService.sign.mockReturnValue('new-access-token');
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      const result = await service.refreshToken(refreshTokenDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalled();
    });

    it('deve lançar UnauthorizedException quando refresh token é inválido', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('deve lançar UnauthorizedException quando refresh token está revogado', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        ...mockRefreshToken,
        revokedAt: new Date(),
      });

      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('deve lançar UnauthorizedException quando refresh token está expirado', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        ...mockRefreshToken,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getProfile', () => {
    const mockUser = {
      id: 'user-id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'admin',
      tenantId: 'tenant-id',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('deve retornar perfil do usuário', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getProfile('user-id');

      expect(result).toHaveProperty('id', 'user-id');
      expect(result).toHaveProperty('email', 'test@example.com');
      expect(result).toHaveProperty('name', 'Test User');
    });

    it('deve lançar NotFoundException quando usuário não existe', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('user-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar BadRequestException quando userId está vazio', async () => {
      await expect(service.getProfile('')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('changePassword', () => {
    const changePasswordDto: ChangePasswordDto = {
      currentPassword: 'CurrentPass123',
      newPassword: 'NewPassword123',
      confirmPassword: 'NewPassword123',
    };

    const mockUser = {
      id: 'user-id',
      password: 'hashedCurrentPassword',
    };

    it('deve alterar senha com sucesso', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedNewPassword' as never);
      mockPrismaService.user.update.mockResolvedValue({});
      mockPrismaService.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      await service.changePassword('user-id', changePasswordDto);

      expect(mockPrismaService.user.update).toHaveBeenCalled();
      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalled();
    });

    it('deve lançar BadRequestException quando senhas não coincidem', async () => {
      const invalidDto = {
        ...changePasswordDto,
        confirmPassword: 'DifferentPassword123',
      };

      await expect(service.changePassword('user-id', invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lançar BadRequestException quando nova senha é igual à atual', async () => {
      const invalidDto = {
        ...changePasswordDto,
        newPassword: 'CurrentPass123',
        confirmPassword: 'CurrentPass123',
      };

      await expect(service.changePassword('user-id', invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lançar UnauthorizedException quando senha atual está incorreta', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.changePassword('user-id', changePasswordDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('deve lançar NotFoundException quando usuário não existe', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.changePassword('user-id', changePasswordDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

