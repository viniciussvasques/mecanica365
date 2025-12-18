# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Instalar dependências do sistema
# Adicionar repositório oficial do PostgreSQL para instalar versão 16
RUN apt-get update && apt-get install -y \
    gnupg2 \
    curl \
    && curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /usr/share/keyrings/postgresql-keyring.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/postgresql-keyring.gpg] http://apt.postgresql.org/pub/repos/apt bookworm-pgdg main" > /etc/apt/sources.list.d/pgdg.list \
    && apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    postgresql-client-16 \
    && rm -rf /var/lib/apt/lists/*

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências (incluindo dev para build)
RUN npm ci && npm cache clean --force

# Copiar arquivos necessários para build
COPY prisma ./prisma/
COPY src ./src/
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Gerar Prisma Client
RUN npx prisma generate --schema=./prisma/schema.prisma

# Build da aplicação
RUN npm run build

# Production stage
FROM node:20-slim AS production

WORKDIR /app

# Instalar dependências do sistema para produção
# Adicionar repositório oficial do PostgreSQL para instalar versão 16
RUN apt-get update && apt-get install -y \
    gnupg2 \
    curl \
    && curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /usr/share/keyrings/postgresql-keyring.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/postgresql-keyring.gpg] http://apt.postgresql.org/pub/repos/apt bookworm-pgdg main" > /etc/apt/sources.list.d/pgdg.list \
    && apt-get update && apt-get install -y \
    postgresql-client-16 \
    wget \
    bash \
    && rm -rf /var/lib/apt/lists/*

# Copiar node_modules e dist do builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Criar usuário não-root
RUN groupadd -g 1001 nodejs && \
    useradd -s /bin/bash -u 1001 -g nodejs nestjs

# Criar pasta de uploads com ownership correto
RUN mkdir -p /app/uploads/logos && \
    chown -R nestjs:nodejs /app/uploads /app/dist /app/prisma

USER nestjs

# Expor porta
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# Comando de produção
CMD ["node", "dist/main"]


