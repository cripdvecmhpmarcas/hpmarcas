#!/bin/bash
# Script para rebuild completo do projeto HP Marcas
# Este script resolve problemas de Server Action hash mismatch

echo "🧹 Limpando cache e builds antigos..."

# Limpar cache do Next.js
rm -rf .next

# Limpar node_modules (opcional mas recomendado)
# rm -rf node_modules
# npm install

# Limpar cache do npm
npm cache clean --force

echo "🔨 Executando build completo..."

# Build de produção
npm run build

echo "✅ Build completo finalizado!"
echo "🚀 Agora você pode fazer deploy ou testar localmente"

# Para testar localmente após o build:
# npm run start
