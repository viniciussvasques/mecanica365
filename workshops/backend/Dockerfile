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
COPY prisma ./prisma/

# Instalar dependências
RUN npm ci --only=production && npm cache clean --force

# Copiar código fonte
COPY . .

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
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Criar pasta de uploads
RUN mkdir -p /app/uploads/logos && \
    chown -R nestjs:nodejs /app/uploads

# Mudar ownership
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expor porta
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# Comando de produção
CMD ["node", "dist/main"]


