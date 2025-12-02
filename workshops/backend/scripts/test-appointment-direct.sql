-- Teste direto de criação de agendamento no banco
-- Este script cria um agendamento diretamente no banco para testar

-- Dados de teste (ajustar conforme necessário)
DO $$
DECLARE
    v_tenant_id UUID := '9e367b08-04c8-44c3-bac0-8236a69f40fb';
    v_customer_id UUID;
    v_service_order_id UUID;
    v_mechanic_id UUID;
    v_appointment_id UUID;
    v_appointment_date TIMESTAMP;
BEGIN
    -- Buscar IDs existentes
    SELECT id INTO v_customer_id FROM customers WHERE "tenantId" = v_tenant_id LIMIT 1;
    SELECT id INTO v_service_order_id FROM service_orders WHERE number = 'OS-006' LIMIT 1;
    SELECT id INTO v_mechanic_id FROM users WHERE "tenantId" = v_tenant_id AND role = 'mechanic' LIMIT 1;
    
    -- Data: amanhã às 9h UTC
    v_appointment_date := (CURRENT_DATE + INTERVAL '1 day') + TIME '09:00:00';
    
    -- Criar agendamento
    INSERT INTO appointments (
        id,
        "tenantId",
        "customerId",
        "serviceOrderId",
        "assignedToId",
        date,
        duration,
        "serviceType",
        notes,
        status,
        "reminderSent",
        "createdAt",
        "updatedAt"
    ) VALUES (
        gen_random_uuid(),
        v_tenant_id,
        v_customer_id,
        v_service_order_id,
        v_mechanic_id,
        v_appointment_date,
        60,
        'Teste Manual Direto',
        'Agendamento criado via teste SQL direto',
        'scheduled',
        false,
        NOW(),
        NOW()
    ) RETURNING id INTO v_appointment_id;
    
    RAISE NOTICE '✅ Agendamento criado com sucesso!';
    RAISE NOTICE '   ID: %', v_appointment_id;
    RAISE NOTICE '   Data: %', v_appointment_date;
    RAISE NOTICE '   Service Order: %', v_service_order_id;
    RAISE NOTICE '   Mecânico: %', v_mechanic_id;
END $$;

-- Verificar se foi criado
SELECT 
    id,
    "tenantId",
    "customerId",
    "serviceOrderId",
    "assignedToId",
    date,
    duration,
    status,
    "serviceType",
    notes,
    "createdAt"
FROM appointments
WHERE "tenantId" = '9e367b08-04c8-44c3-bac0-8236a69f40fb'
ORDER BY "createdAt" DESC
LIMIT 5;

