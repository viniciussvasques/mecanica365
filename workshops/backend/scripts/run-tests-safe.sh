#!/bin/sh
# Script simples para executar testes quando há múltiplos projetos rodando

echo "🧪 Executando testes..."

# Executar testes de forma simples e direta
jest --runInBand --cache=false --forceExit --no-coverage 2>&1 | tail -30

