#!/bin/sh
docker run --rm \
  --network mecanica365-workshops_mecanica365-workshops-network \
  -v "$(pwd):/usr/src" \
  -w /usr/src \
  -e SONAR_LOGIN=admin \
  -e SONAR_PASSWORD=admin \
  sonarsource/sonar-scanner-cli \
  -Dsonar.host.url=http://sonarqube:9000 \
  -Dsonar.projectKey=mecanica365-workshops-backend \
  -Dsonar.sources=src \
  -Dsonar.exclusions="node_modules/**,dist/**,coverage/**,**/*.spec.ts,**/*.e2e-spec.ts,**/*.d.ts"

