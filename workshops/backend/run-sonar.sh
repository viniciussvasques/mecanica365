#!/bin/bash
# Script para executar análise do SonarQube
# Token salvo em .sonar-token

TOKEN=$(cat .sonar-token 2>/dev/null || echo "")

if [ -z "$TOKEN" ]; then
  echo "❌ Token não encontrado em .sonar-token"
  echo "Por favor, crie o arquivo .sonar-token com o token do SonarQube"
  exit 1
fi

echo "🔍 Executando análise do SonarQube..."
echo "📊 Project Key: mecanica-365"
echo ""

# Converter caminho Windows para formato Docker
BACKEND_PATH=$(pwd | sed 's|^/mnt/\([a-z]\)|\1:|' | sed 's|/|\\|g' | sed 's|\\|/|g')

docker run --rm \
  --network mecanica365-workshops_mecanica365-workshops-network \
  -v "$(pwd):/usr/src" \
  -w /usr/src \
  -e SONAR_TOKEN="$TOKEN" \
  sonarsource/sonar-scanner-cli \
  -Dsonar.host.url=http://sonarqube:9000 \
  -Dsonar.token="$TOKEN" \
  -Dsonar.projectKey=mecanica-365

echo ""
echo "✅ Análise concluída!"
echo "📊 Acesse http://localhost:9000 para ver os resultados"

