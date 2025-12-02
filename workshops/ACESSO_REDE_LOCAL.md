# 🌐 Guia de Acesso via Subdomínio na Rede Local

Este guia explica como acessar o sistema Mecânica365 usando subdomínios de outros dispositivos na mesma rede local.

## 📋 Pré-requisitos

1. Todos os dispositivos devem estar na mesma rede Wi-Fi/Ethernet
2. Firewall do Windows deve permitir conexões nas portas 3000 (frontend) e 3001 (backend)
3. Conhecer o IP local da máquina que está rodando o sistema

## 🔍 Passo 1: Descobrir o IP da Máquina

### Windows (PowerShell):
```powershell
ipconfig | Select-String -Pattern "IPv4"
```

### Linux/Mac:
```bash
ifconfig | grep "inet "
# ou
ip addr show | grep "inet "
```

Anote o IP encontrado (exemplo: `192.168.1.100`)

## 🔧 Passo 2: Configurar o Next.js para Aceitar Conexões Externas

O Next.js por padrão só aceita conexões de `localhost`. Para aceitar conexões da rede:

### Opção A: Modificar o script de desenvolvimento

Edite `workshops/frontend/package.json`:

```json
{
  "scripts": {
    "dev": "next dev -H 0.0.0.0",
    "dev:network": "next dev -H 0.0.0.0 -p 3000"
  }
}
```

### Opção B: Usar variável de ambiente

Crie/edite `.env.local` em `workshops/frontend/`:

```env
HOSTNAME=0.0.0.0
PORT=3000
```

## 🌐 Passo 3: Configurar DNS Local (Recomendado)

### Windows - Editar arquivo hosts

1. Abra o Notepad como Administrador
2. Abra o arquivo: `C:\Windows\System32\drivers\etc\hosts`
3. Adicione as linhas (substitua `192.168.1.100` pelo IP da sua máquina):

```
192.168.1.100    oficinartee.localhost
192.168.1.100    oficina2.localhost
192.168.1.100    oficina3.localhost
```

4. Salve o arquivo

### Linux/Mac - Editar arquivo hosts

```bash
sudo nano /etc/hosts
```

Adicione as mesmas linhas acima.

## 📱 Passo 4: Acessar de Outros Dispositivos

### No dispositivo móvel/computador da rede:

1. **Configure o DNS local** (mesmo processo acima)
2. **Acesse no navegador:**
   ```
   http://oficinartee.localhost:3000
   ```

### Alternativa: Usar IP diretamente

Se não quiser configurar DNS, você pode modificar temporariamente o código para usar o IP:

1. Edite `workshops/frontend/lib/api.ts`
2. Substitua `localhost` pelo IP da máquina (ex: `192.168.1.100`)

## 🔥 Passo 5: Configurar Firewall do Windows

1. Abra "Firewall do Windows Defender"
2. Clique em "Configurações Avançadas"
3. Clique em "Regras de Entrada" → "Nova Regra"
4. Selecione "Porta" → Próximo
5. Selecione "TCP" e digite as portas: `3000, 3001`
6. Permita a conexão
7. Aplique para todos os perfis
8. Dê um nome: "Mecânica365 - Frontend e Backend"

## 🐳 Passo 6: Se estiver usando Docker

Se o backend estiver rodando no Docker, verifique se as portas estão expostas:

```yaml
# docker-compose.yml
services:
  backend:
    ports:
      - "0.0.0.0:3001:3001"  # Aceita conexões de qualquer IP
```

## ✅ Teste de Conectividade

### Do dispositivo remoto, teste:

```bash
# Testar se o backend responde
curl http://192.168.1.100:3001/api/health

# Testar se o frontend responde
curl http://192.168.1.100:3000
```

## 🚨 Solução de Problemas

### Problema: "Connection refused"
- **Solução**: Verifique se o firewall está permitindo as portas
- **Solução**: Verifique se os serviços estão rodando em `0.0.0.0` e não apenas `localhost`

### Problema: "Subdomain not found"
- **Solução**: Verifique se o subdomain está configurado no banco de dados
- **Solução**: Use o header `X-Tenant-Subdomain` nas requisições

### Problema: CORS errors
- **Solução**: Configure CORS no backend para aceitar o IP da rede local

## 📝 Notas Importantes

1. **Segurança**: Em produção, use HTTPS e configure certificados SSL adequados
2. **Performance**: Conexões de rede podem ser mais lentas que localhost
3. **DNS**: O arquivo `hosts` só funciona no dispositivo onde foi editado
4. **IP Dinâmico**: Se o IP mudar, você precisará atualizar as configurações

## 🔐 Alternativa: Usar Nginx como Proxy Reverso

Para uma solução mais robusta, configure um Nginx:

```nginx
server {
    listen 80;
    server_name *.local.mechanic365;

    location / {
        proxy_pass http://192.168.1.100:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

E configure DNS local para `*.local.mechanic365` apontar para `192.168.1.100`.

