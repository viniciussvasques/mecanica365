# Setup do Frontend - Mecânica365

## 🚀 Instalação Rápida

### 1. Instalar dependências
```bash
cd workshops/frontend
npm install
```

### 2. Configurar variáveis de ambiente
Crie um arquivo `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 3. Executar em desenvolvimento
```bash
npm run dev
```

### 4. Acessar
Abra o navegador em: `http://localhost:3000`

## 📋 Páginas Disponíveis

- **/** - Landing page
- **/login** - Página de login
- **/register** - Página de registro/onboarding
- **/onboarding/success** - Página de sucesso após pagamento

## 🔄 Fluxo Completo

1. **Landing Page** → Clique em "Começar Agora"
2. **Registro** → Preencha os dados da oficina
3. **Escolha do Plano** → Selecione plano e ciclo de cobrança
4. **Stripe Checkout** → Redirecionamento para pagamento
5. **Sucesso** → Após pagamento, retorna para página de sucesso
6. **Login** → Use as credenciais enviadas por email

## 🐛 Troubleshooting

### Erro de CORS
Se houver erro de CORS, verifique se o backend está configurado para aceitar requisições de `http://localhost:3000`.

### API não responde
Verifique se o backend está rodando em `http://localhost:3001` e se a variável `NEXT_PUBLIC_API_URL` está correta.

