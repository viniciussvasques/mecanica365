# Carvex - Backend API

API para consulta de histórico de veículos no Brasil, similar ao Carfax, mas adaptado para o mercado brasileiro.

## 🚀 Começando

### Pré-requisitos

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Yarn ou NPM
- Docker (opcional para desenvolvimento)

### Instalação

1. **Clonar o repositório**
   ```bash
   git clone https://github.com/seu-usuario/vehicle-history-service.git
   cd vehicle-history-service/backend
   ```

2. **Instalar dependências**
   ```bash
   npm install
   # ou
   yarn
   ```

3. **Configurar ambiente**
   - Copiar o arquivo `.env.example` para `.env`
   - Configurar as variáveis de ambiente conforme necessário

4. **Configurar banco de dados**
   ```bash
   # Aplicar migrações
   npx prisma migrate dev --name init
   
   # Popular banco de dados com dados iniciais
   npx prisma db seed
   ```

5. **Iniciar o servidor**
   ```bash
   # Modo desenvolvimento
   npm run start:dev
   
   # Modo produção
   npm run build
   npm run start:prod
   ```

## 🛠️ Tecnologias

- **Backend:** NestJS 10+
- **Banco de Dados:** PostgreSQL 15+ com PostGIS
- **Cache:** Redis 7+
- **Autenticação:** JWT + Passport
- **Documentação:** Swagger/OpenAPI
- **Testes:** Jest
- **Containerização:** Docker

## 📚 Documentação da API

A documentação da API está disponível em `http://localhost:3000/api` quando o servidor estiver em execução.

## 🧪 Testes

```bash
# Executar testes unitários
npm run test

# Executar testes e2e
npm run test:e2e

# Gerar cobertura de código
npm run test:cov
```

## 🐳 Docker

```bash
# Construir a imagem
docker build -t carvex-api .

# Executar os containers
docker-compose up -d
```

## 🔒 Segurança

- Autenticação JWT
- Rate Limiting
- CORS habilitado apenas para origens confiáveis
- Headers de segurança com Helmet
- Validação de entrada com class-validator
- Logging detalhado

## 📊 Estrutura do Projeto

```
backend/
├── src/
│   ├── modules/          # Módulos da aplicação
│   │   ├── auth/         # Autenticação e autorização
│   │   ├── veiculo/      # Gestão de veículos
│   │   ├── documento/    # Documentos do veículo
│   │   ├── sinistro/     # Histórico de sinistros
│   │   ├── usuario/      # Gestão de usuários
│   │   ├── integracao/   # Integrações externas
│   │   └── relatorio/    # Geração de relatórios
│   │
│   ├── shared/           # Código compartilhado
│   │   ├── common/       # DTOs, interfaces, enums
│   │   ├── config/       # Configurações
│   │   ├── database/     # Configuração do banco de dados
│   │   ├── filters/      # Filtros de exceção
│   │   ├── guards/       # Guards de autenticação/autorização
│   │   ├── interceptors/ # Interceptores
│   │   ├── logger/       # Configuração de logs
│   │   └── utils/        # Utilitários
│   │
│   ├── app.module.ts     # Módulo raiz
│   └── main.ts           # Ponto de entrada
│
├── prisma/               # Schema do Prisma e migrações
├── test/                 # Testes e2e
├── .env                  # Variáveis de ambiente
└── package.json          # Dependências e scripts
```

## 🤝 Contribuição

1. Faça um Fork do projeto
2. Crie uma Branch para sua Feature (`git checkout -b feature/AmazingFeature`)
3. Adicione suas mudanças (`git add .`)
4. Comite suas mudanças (`git commit -m 'Add some AmazingFeature'`)
5. Faça o Push da Branch (`git push origin feature/AmazingFeature`)
6. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## ✉️ Contato

Equipe Carvex - contato@carvex.app

---

Desenvolvido com ❤️ para o mercado brasileiro de veículos
