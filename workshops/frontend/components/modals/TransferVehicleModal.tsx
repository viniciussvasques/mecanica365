import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Customer } from '@/lib/api/customers';

interface TransferVehicleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (vehicleId: string, newOwnerId: string) => Promise<void>;
    vehicleId: string | null;
    availableCustomers: Customer[];
}

export default function TransferVehicleModal({
    isOpen,
    onClose,
    onConfirm,
    vehicleId,
    availableCustomers,
}: TransferVehicleModalProps) {
    const [newOwnerId, setNewOwnerId] = useState<string>('');

    if (!isOpen || !vehicleId) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6 max-w-md w-full">
                <h3 className="text-xl font-semibold text-[#D0D6DE] mb-4">Transferir Veículo</h3>
                <p className="text-[#7E8691] mb-4">
                    Selecione o novo proprietário para este veículo:
                </p>
                <Select
                    label="Novo Proprietário *"
                    value={newOwnerId}
                    onChange={(e) => setNewOwnerId(e.target.value)}
                    options={[
                        { value: '', label: 'Selecione um cliente...' },
                        ...availableCustomers.map((customer) => ({
                            value: customer.id,
                            label: `${customer.name}${customer.phone ? ` - ${customer.phone}` : ''}`,
                        })),
                    ]}
                />
                <div className="flex items-center justify-end gap-3 mt-6">
                    <Button
                        variant="secondary"
                        onClick={() => {
                            onClose();
                            setNewOwnerId('');
                        }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => onConfirm(vehicleId, newOwnerId)}
                        disabled={!newOwnerId}
                    >
                        Transferir
                    </Button>
                </div>
            </div>
        </div>
    );
}
