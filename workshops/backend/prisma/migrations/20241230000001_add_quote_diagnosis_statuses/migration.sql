-- Migration: Adicionar novos status de diagnóstico aos orçamentos
-- Os novos status são: awaiting_diagnosis, diagnosed
-- Como o campo status é String, não é necessário alterar a estrutura da tabela
-- Esta migration apenas documenta a mudança

-- Verificar se a tabela quotes existe
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') THEN
        -- Os novos valores de status já são suportados pelo tipo String
        -- Não é necessária alteração estrutural
        RAISE NOTICE 'Tabela quotes existe. Novos status awaiting_diagnosis e diagnosed já são suportados.';
    END IF;
END $$;

