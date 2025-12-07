const { execSync } = require('child_process');
const path = require('path');

console.log('🔄 Executando tsc-alias para resolver path aliases...');
try {
  execSync('npx tsc-alias -p tsconfig.json', {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
  });
  console.log('✅ Path aliases resolvidos com sucesso!');
} catch (error) {
  console.error('❌ Erro ao executar tsc-alias:', error.message);
  process.exit(1);
}

