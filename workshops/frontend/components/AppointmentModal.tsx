'use client';

import { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import {
  appointmentsApi,
  CreateAppointmentDto,
  UpdateAppointmentDto,
  Appointment,
  AvailableSlot,
} from '@/lib/api/appointments';
import { customersApi, Customer } from '@/lib/api/customers';
import { serviceOrdersApi, ServiceOrder, ServiceOrderStatus } from '@/lib/api/service-orders';
import { usersApi, User } from '@/lib/api/users';
import { elevatorsApi, Elevator } from '@/lib/api/elevators';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment?: Appointment | null;
  initialDate?: Date;
  onSuccess?: () => void;
}

export function AppointmentModal({
  isOpen,
  onClose,
  appointment,
  initialDate,
  onSuccess,
}: AppointmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Form fields
  const [customerId, setCustomerId] = useState<string>('');
  const [serviceOrderId, setServiceOrderId] = useState<string>('');
  const [assignedToId, setAssignedToId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [duration, setDuration] = useState<number>(60);
  const [serviceType, setServiceType] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [elevatorId, setElevatorId] = useState<string>('');

  // Options
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [mechanics, setMechanics] = useState<User[]>([]);
  const [elevators, setElevators] = useState<Elevator[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadOptions();
      if (appointment) {
        // Edit mode
        setCustomerId(appointment.customerId || '');
        setServiceOrderId(appointment.serviceOrderId || '');
        setAssignedToId(appointment.assignedToId || '');
        const aptDate = new Date(appointment.date);
        setDate(aptDate.toISOString().split('T')[0]);
        setTime(aptDate.toTimeString().slice(0, 5));
        setDuration(appointment.duration || 60);
        setServiceType(appointment.serviceType || '');
        setNotes(appointment.notes || '');
      } else if (initialDate) {
        // Create mode with initial date
        setDate(initialDate.toISOString().split('T')[0]);
        setTime(initialDate.toTimeString().slice(0, 5));
      } else {
        // Create mode without initial date
        const now = new Date();
        setDate(now.toISOString().split('T')[0]);
        setTime('09:00');
      }
    }
  }, [isOpen, appointment, initialDate]);

  useEffect(() => {
    if (date && duration) {
      checkAvailableSlots();
    }
  }, [date, duration, elevatorId]);

  const loadOptions = async () => {
    try {
      const [customersRes, serviceOrdersRes, usersRes, elevatorsRes] = await Promise.all([
        customersApi.findAll({ page: 1, limit: 100 }),
        serviceOrdersApi.findAll({ 
          page: 1, 
          limit: 100, 
          status: ServiceOrderStatus.SCHEDULED 
        }),
        usersApi.findAll({ role: 'mechanic' }),
        elevatorsApi.findAll(),
      ]);

      setCustomers(Array.isArray(customersRes) ? customersRes : customersRes.data || []);
      setServiceOrders(Array.isArray(serviceOrdersRes) ? serviceOrdersRes : serviceOrdersRes.data || []);
      setMechanics(Array.isArray(usersRes) ? usersRes.filter((u) => u.isActive) : []);
      setElevators(Array.isArray(elevatorsRes) ? elevatorsRes.filter((e) => e.status === 'free' || e.status === 'scheduled') : (elevatorsRes.data || []).filter((e) => e.status === 'free' || e.status === 'scheduled'));
    } catch (error) {
      console.error('Erro ao carregar opções:', error);
    }
  };

  const checkAvailableSlots = async () => {
    if (!date || !duration) return;

    try {
      setCheckingAvailability(true);
      const response = await appointmentsApi.getAvailableSlots({
        date,
        duration,
        elevatorId: elevatorId || undefined,
      });
      setAvailableSlots(response.availableSlots);
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleSlotSelect = (slot: AvailableSlot) => {
    if (slot.available) {
      setSelectedSlot(slot.startTime);
      setTime(slot.startTime);
    }
  };

  const handleSubmit = async () => {
    if (!customerId && !serviceOrderId) {
      alert('Selecione um cliente ou uma ordem de serviço');
      return;
    }

    if (!date || !time) {
      alert('Selecione data e horário');
      return;
    }

    try {
      setLoading(true);

      const dateTime = new Date(`${date}T${time}`);
      const appointmentData: CreateAppointmentDto | UpdateAppointmentDto = {
        customerId: customerId || undefined,
        serviceOrderId: serviceOrderId || undefined,
        assignedToId: assignedToId || undefined,
        date: dateTime.toISOString(),
        duration,
        serviceType: serviceType || undefined,
        notes: notes || undefined,
      };

      if (appointment) {
        await appointmentsApi.update(appointment.id, appointmentData as UpdateAppointmentDto);
      } else {
        await appointmentsApi.create(appointmentData as CreateAppointmentDto);
      }

      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error);
      alert(error instanceof Error ? error.message : 'Erro ao salvar agendamento');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCustomerId('');
    setServiceOrderId('');
    setAssignedToId('');
    setDate('');
    setTime('');
    setDuration(60);
    setServiceType('');
    setNotes('');
    setElevatorId('');
    setSelectedSlot(null);
    setAvailableSlots([]);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={appointment ? 'Editar Agendamento' : 'Novo Agendamento'}
      size="lg"
    >
      <div className="space-y-6">
        {/* Cliente ou Ordem de Serviço */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#D0D6DE] mb-2">
              Cliente
            </label>
            <select
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
                if (e.target.value) setServiceOrderId('');
              }}
              className="w-full px-3 py-2 bg-[#1A1D24] border border-[#2A3038] rounded-lg text-[#D0D6DE] focus:outline-none focus:ring-2 focus:ring-[#00E0B8]"
            >
              <option value="">Selecione um cliente</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} - {customer.phone}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#D0D6DE] mb-2">
              Ordem de Serviço
            </label>
            <select
              value={serviceOrderId}
              onChange={(e) => {
                setServiceOrderId(e.target.value);
                if (e.target.value) {
                  const so = serviceOrders.find((s) => s.id === e.target.value);
                  if (so) {
                    setCustomerId(so.customerId || '');
                    setAssignedToId(so.technicianId || '');
                  }
                }
              }}
              className="w-full px-3 py-2 bg-[#1A1D24] border border-[#2A3038] rounded-lg text-[#D0D6DE] focus:outline-none focus:ring-2 focus:ring-[#00E0B8]"
            >
              <option value="">Selecione uma OS</option>
              {serviceOrders.map((so) => (
                <option key={so.id} value={so.id}>
                  {so.number} - {so.customer?.name || 'Sem cliente'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Data e Horário */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#D0D6DE] mb-2">
              Data
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-[#1A1D24] border border-[#2A3038] rounded-lg text-[#D0D6DE] focus:outline-none focus:ring-2 focus:ring-[#00E0B8]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#D0D6DE] mb-2">
              Horário
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 bg-[#1A1D24] border border-[#2A3038] rounded-lg text-[#D0D6DE] focus:outline-none focus:ring-2 focus:ring-[#00E0B8]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#D0D6DE] mb-2">
              Duração (min)
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full px-3 py-2 bg-[#1A1D24] border border-[#2A3038] rounded-lg text-[#D0D6DE] focus:outline-none focus:ring-2 focus:ring-[#00E0B8]"
            >
              <option value={30}>30 min</option>
              <option value={60}>1 hora</option>
              <option value={90}>1h 30min</option>
              <option value={120}>2 horas</option>
              <option value={180}>3 horas</option>
              <option value={240}>4 horas</option>
            </select>
          </div>
        </div>

        {/* Horários Disponíveis */}
        {date && duration && (
          <div>
            <label className="block text-sm font-medium text-[#D0D6DE] mb-2">
              Horários Disponíveis
            </label>
            {checkingAvailability ? (
              <div className="text-center py-4 text-[#7E8691]">Verificando disponibilidade...</div>
            ) : availableSlots.length > 0 ? (
              <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                {availableSlots.map((slot, index) => (
                  <button
                    key={index}
                    onClick={() => handleSlotSelect(slot)}
                    disabled={!slot.available}
                    className={`
                      px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${slot.available
                        ? selectedSlot === slot.startTime
                          ? 'bg-[#00E0B8] text-[#0F1115]'
                          : 'bg-[#1A1D24] border border-[#2A3038] text-[#D0D6DE] hover:border-[#00E0B8]'
                        : 'bg-[#2A3038] text-[#7E8691] cursor-not-allowed opacity-50'
                      }
                    `}
                    title={slot.reason || (slot.available ? 'Disponível' : 'Indisponível')}
                  >
                    {slot.startTime}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-[#7E8691]">
                Nenhum horário disponível para esta data
              </div>
            )}
          </div>
        )}

        {/* Mecânico e Elevador */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#D0D6DE] mb-2">
              Mecânico (opcional)
            </label>
            <select
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
              className="w-full px-3 py-2 bg-[#1A1D24] border border-[#2A3038] rounded-lg text-[#D0D6DE] focus:outline-none focus:ring-2 focus:ring-[#00E0B8]"
            >
              <option value="">Não atribuir</option>
              {mechanics.map((mechanic) => (
                <option key={mechanic.id} value={mechanic.id}>
                  {mechanic.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#D0D6DE] mb-2">
              Elevador (opcional)
            </label>
            <select
              value={elevatorId}
              onChange={(e) => setElevatorId(e.target.value)}
              className="w-full px-3 py-2 bg-[#1A1D24] border border-[#2A3038] rounded-lg text-[#D0D6DE] focus:outline-none focus:ring-2 focus:ring-[#00E0B8]"
            >
              <option value="">Não especificar</option>
              {elevators.map((elevator) => (
                <option key={elevator.id} value={elevator.id}>
                  {elevator.name} ({elevator.number})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tipo de Serviço e Observações */}
        <div>
          <label className="block text-sm font-medium text-[#D0D6DE] mb-2">
            Tipo de Serviço
          </label>
          <input
            type="text"
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            placeholder="Ex: Manutenção preventiva, Revisão..."
            className="w-full px-3 py-2 bg-[#1A1D24] border border-[#2A3038] rounded-lg text-[#D0D6DE] focus:outline-none focus:ring-2 focus:ring-[#00E0B8]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#D0D6DE] mb-2">
            Observações
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Observações adicionais sobre o agendamento..."
            className="w-full px-3 py-2 bg-[#1A1D24] border border-[#2A3038] rounded-lg text-[#D0D6DE] focus:outline-none focus:ring-2 focus:ring-[#00E0B8] resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-[#2A3038]">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Salvando...' : appointment ? 'Atualizar' : 'Criar Agendamento'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

