import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsService } from './appointments.service';
import { PrismaService } from '@database/prisma.service';
import { ElevatorsService } from '../elevators/elevators.service';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { AppointmentStatus } from './dto';

describe('AppointmentsService', () => {
  let service: AppointmentsService;

  const mockTenantId = 'tenant-123';
  const mockAppointmentId = 'appointment-123';
  const mockCustomerId = 'customer-123';
  const mockServiceOrderId = 'service-order-123';
  const mockMechanicId = 'mechanic-123';

  const mockAppointment = {
    id: mockAppointmentId,
    tenantId: mockTenantId,
    customerId: mockCustomerId,
    serviceOrderId: mockServiceOrderId,
    assignedToId: mockMechanicId,
    date: new Date('2024-12-15T10:00:00Z'),
    duration: 60,
    serviceType: 'Manutenção preventiva',
    notes: 'Cliente prefere manhã',
    status: AppointmentStatus.SCHEDULED,
    reminderSent: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    customer: {
      id: mockCustomerId,
      name: 'Cliente Teste',
      phone: '11999999999',
      email: 'cliente@teste.com',
    },
    serviceOrder: null,
    assignedTo: {
      id: mockMechanicId,
      name: 'Mecânico Teste',
      email: 'mecanico@teste.com',
    },
  };

  const mockPrismaService = {
    appointment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    customer: {
      findFirst: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
    },
    serviceOrder: {
      findFirst: jest.fn(),
    },
    elevator: {
      findFirst: jest.fn(),
    },
    elevatorUsage: {
      findFirst: jest.fn(),
    },
  };

  const mockElevatorsService = {
    reserve: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ElevatorsService,
          useValue: mockElevatorsService,
        },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1); // Amanhã

    const createDto = {
      customerId: mockCustomerId,
      date: futureDate.toISOString(),
      duration: 60,
      serviceType: 'Manutenção preventiva',
      notes: 'Cliente prefere manhã',
      status: AppointmentStatus.SCHEDULED,
    };

    it('deve criar um agendamento com sucesso', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue({
        id: mockCustomerId,
        name: 'Cliente Teste',
      });
      mockPrismaService.appointment.findMany.mockResolvedValue([]);
      mockPrismaService.appointment.create.mockResolvedValue({
        ...mockAppointment,
        date: futureDate,
      });

      const result = await service.create(mockTenantId, createDto);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockAppointmentId);
      expect(mockPrismaService.appointment.create).toHaveBeenCalled();
    });

    it('deve lançar erro se data for no passado', async () => {
      const pastDate = new Date('2020-01-01T10:00:00Z').toISOString();
      const dtoWithPastDate = { ...createDto, date: pastDate };

      await expect(
        service.create(mockTenantId, dtoWithPastDate),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar erro se cliente não existir', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue(null);

      await expect(service.create(mockTenantId, createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar erro se houver conflito de horário com mecânico', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue({
        id: mockCustomerId,
      });
      mockPrismaService.user.findFirst.mockResolvedValue({
        id: mockMechanicId,
        role: 'mechanic',
      });
      mockPrismaService.appointment.findMany.mockResolvedValue([
        {
          id: 'other-appointment',
          date: futureDate,
          duration: 60,
        },
      ]);

      const dtoWithMechanic = { ...createDto, assignedToId: mockMechanicId };

      await expect(
        service.create(mockTenantId, dtoWithMechanic),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('deve retornar um agendamento por ID', async () => {
      mockPrismaService.appointment.findFirst.mockResolvedValue(
        mockAppointment,
      );

      const result = await service.findOne(mockTenantId, mockAppointmentId);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockAppointmentId);
    });

    it('deve lançar erro se agendamento não existir', async () => {
      mockPrismaService.appointment.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(mockTenantId, mockAppointmentId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancel', () => {
    it('deve cancelar um agendamento com sucesso', async () => {
      mockPrismaService.appointment.findFirst.mockResolvedValue(
        mockAppointment,
      );
      mockPrismaService.appointment.update.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.CANCELLED,
      });

      const result = await service.cancel(mockTenantId, mockAppointmentId);

      expect(result.status).toBe(AppointmentStatus.CANCELLED);
      expect(mockPrismaService.appointment.update).toHaveBeenCalled();
    });

    it('deve lançar erro se agendamento não existir', async () => {
      mockPrismaService.appointment.findFirst.mockResolvedValue(null);

      await expect(
        service.cancel(mockTenantId, mockAppointmentId),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar erro se agendamento já estiver completo', async () => {
      mockPrismaService.appointment.findFirst.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.COMPLETED,
      });

      await expect(
        service.cancel(mockTenantId, mockAppointmentId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('deve remover um agendamento com sucesso', async () => {
      mockPrismaService.appointment.findFirst.mockResolvedValue(
        mockAppointment,
      );
      mockPrismaService.appointment.delete.mockResolvedValue(mockAppointment);

      await service.remove(mockTenantId, mockAppointmentId);

      expect(mockPrismaService.appointment.delete).toHaveBeenCalled();
    });

    it('deve lançar erro se agendamento não existir', async () => {
      mockPrismaService.appointment.findFirst.mockResolvedValue(null);

      await expect(
        service.remove(mockTenantId, mockAppointmentId),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar erro se agendamento estiver em progresso', async () => {
      mockPrismaService.appointment.findFirst.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.IN_PROGRESS,
      });

      await expect(
        service.remove(mockTenantId, mockAppointmentId),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
