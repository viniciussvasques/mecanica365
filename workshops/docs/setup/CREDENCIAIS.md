# 🔐 Credenciais do Painel Admin

## Usuário Super Admin

Após executar o seed do banco de dados, as credenciais padrão são:

- **Email:** `admin@mecanica365.com`
- **Senha:** `Admin123!@#`

⚠️ **IMPORTANTE:** Altere a senha após o primeiro login!

## Como criar o usuário admin

Execute o seed dentro do container Docker:

```bash
cd workshops/backend
docker-compose exec backend npx tsx prisma/seeds/index.ts
```

Ou se preferir executar diretamente no container:

```bash
docker-compose exec backend sh -c "npx tsx prisma/seeds/index.ts"
```

## Como funciona

1. O seed cria um tenant especial chamado `system` (subdomain: `system`)
2. Cria um usuário com email `admin@mecanica365.com` e role `superadmin`
3. O painel admin faz login usando o header `X-Tenant-Subdomain: system`
4. O frontend verifica se o email termina com `@mecanica365.com` ou se o role é `superadmin`

## Acesso

- **URL do Painel Admin:** http://localhost:3002
- **URL de Login:** http://localhost:3002/login

## Alterar senha

Após fazer login, você pode alterar a senha através do perfil do usuário ou diretamente no banco de dados.


