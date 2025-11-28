# Mecânica365 - Frontend

Frontend Next.js para o sistema Mecânica365.

## 🚀 Como executar

1. Instalar dependências:
```bash
npm install
```

2. Configurar variáveis de ambiente:
```bash
# Criar arquivo .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

3. Executar em desenvolvimento:
```bash
npm run dev
```

4. Acessar:
```
http://localhost:3000
```

## 📁 Estrutura

```
frontend/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Landing page
│   ├── login/             # Página de login
│   ├── register/          # Página de registro/onboarding
│   └── onboarding/        # Páginas de onboarding
├── lib/                   # Utilitários
│   └── api.ts            # Cliente API
└── components/           # Componentes reutilizáveis
```

## 🔗 Integração com Backend

O frontend se conecta ao backend através da API em `http://localhost:3001/api`.

### Endpoints utilizados:
- `POST /api/onboarding/register` - Registrar novo tenant
- `POST /api/onboarding/checkout` - Criar sessão de checkout
- `POST /api/auth/login` - Login

## 🎨 Tecnologias

- Next.js 14
- TypeScript
- Tailwind CSS
- Axios

