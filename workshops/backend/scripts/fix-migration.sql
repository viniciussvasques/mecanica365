-- Script para resolver migration que falhou
-- Execute este script no banco de dados onde a migration falhou

-- 1. Marcar a migration como aplicada (se a tabela quotes foi criada)
-- Execute apenas se a tabela quotes existir mas a migration ainda estiver marcada como falhada

-- Verificar se tabela quotes existe
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') THEN
        RAISE NOTICE 'Tabela quotes existe. Migration pode ser marcada como aplicada.';
    ELSE
        RAISE NOTICE 'Tabela quotes não existe. Execute a migration novamente.';
    END IF;
END $$;

-- Se a tabela quotes existe, você pode marcar a migration como aplicada executando:
-- npx prisma migrate resolve --applied 20241216000000_add_quotes_module

-- Ou se preferir, execute a migration manualmente usando o arquivo migration_complete.sql

