const fs = require('fs');

// Ler o arquivo lcov.info
const lcovContent = fs.readFileSync('coverage/lcov.info', 'utf8');

// Extrair informações de cobertura por arquivo
const files = [];
const lines = lcovContent.split('\n');

let currentFile = null;
let currentStats = null;

lines.forEach((line) => {
  // SF: Source file
  if (line.startsWith('SF:')) {
    if (currentFile && currentStats) {
      files.push({ ...currentFile, ...currentStats });
    }
    const filePath = line.substring(3).replace(/\\/g, '/');
    const moduleMatch = filePath.match(/modules\/([^\/]+(?:\/[^\/]+)?)/);
    const module = moduleMatch ? moduleMatch[1] : 'other';
    currentFile = { path: filePath, module };
    currentStats = {
      lines: { found: 0, hit: 0 },
      functions: { found: 0, hit: 0 },
      branches: { found: 0, hit: 0 },
    };
  }

  // LF: Lines found, LH: Lines hit
  if (line.startsWith('LF:')) {
    currentStats.lines.found = parseInt(line.substring(3));
  }
  if (line.startsWith('LH:')) {
    currentStats.lines.hit = parseInt(line.substring(3));
  }

  // FNF: Functions found, FNH: Functions hit
  if (line.startsWith('FNF:')) {
    currentStats.functions.found = parseInt(line.substring(4));
  }
  if (line.startsWith('FNH:')) {
    currentStats.functions.hit = parseInt(line.substring(4));
  }

  // BRF: Branches found, BRH: Branches hit
  if (line.startsWith('BRF:')) {
    currentStats.branches.found = parseInt(line.substring(4));
  }
  if (line.startsWith('BRH:')) {
    currentStats.branches.hit = parseInt(line.substring(4));
  }
});

// Adicionar último arquivo
if (currentFile && currentStats) {
  files.push({ ...currentFile, ...currentStats });
}

// Agrupar por módulo
const modules = {};

files.forEach((file) => {
  if (!file.module || file.module === 'other') return;

  const parts = file.module.split('/');
  const moduleName =
    parts[0] === 'core' || parts[0] === 'shared' || parts[0] === 'workshops'
      ? file.module
      : parts[0];

  if (!modules[moduleName]) {
    modules[moduleName] = {
      lines: { found: 0, hit: 0 },
      functions: { found: 0, hit: 0 },
      branches: { found: 0, hit: 0 },
      files: 0,
    };
  }

  const mod = modules[moduleName];
  mod.lines.found += file.lines.found;
  mod.lines.hit += file.lines.hit;
  mod.functions.found += file.functions.found;
  mod.functions.hit += file.functions.hit;
  mod.branches.found += file.branches.found;
  mod.branches.hit += file.branches.hit;
  mod.files++;
});

// Calcular percentuais
const allResults = Object.entries(modules)
  .map(([name, stats]) => {
    const linesPct =
      stats.lines.found > 0
        ? (stats.lines.hit / stats.lines.found) * 100
        : 100;
    const functionsPct =
      stats.functions.found > 0
        ? (stats.functions.hit / stats.functions.found) * 100
        : 100;
    const branchesPct =
      stats.branches.found > 0
        ? (stats.branches.hit / stats.branches.found) * 100
        : 100;

    // Usar lines como métrica principal (padrão Jest)
    const mainCoverage = linesPct;
    const minCoverage = Math.min(linesPct, functionsPct, branchesPct);
    const avgCoverage = (linesPct + functionsPct + branchesPct) / 3;

    return {
      module: name,
      lines: parseFloat(linesPct.toFixed(2)),
      functions: parseFloat(functionsPct.toFixed(2)),
      branches: parseFloat(branchesPct.toFixed(2)),
      mainCoverage: parseFloat(mainCoverage.toFixed(2)),
      minCoverage: parseFloat(minCoverage.toFixed(2)),
      avgCoverage: parseFloat(avgCoverage.toFixed(2)),
      files: stats.files,
      below80: mainCoverage < 80, // Usar lines como métrica principal
    };
  })
  .sort((a, b) => parseFloat(a.mainCoverage) - parseFloat(b.mainCoverage));

// Filtrar apenas os abaixo de 80%
const results = allResults.filter((r) => r.below80);

console.log('\n📊 MÓDULOS ABAIXO DE 80% DE COBERTURA:\n');
if (results.length === 0) {
  console.log('✅ Todos os módulos têm pelo menos 80% de cobertura!');
} else {
  console.log(
    '#  ' +
      'Módulo'.padEnd(35) +
      'Lines'.padEnd(10) +
      'Functions'.padEnd(12) +
      'Branches'.padEnd(12) +
      'Mínimo'.padEnd(10) +
      'Files',
  );
  console.log('-'.repeat(95));

  results.forEach((r, i) => {
    console.log(
      `${(i + 1).toString().padStart(2)}. ` +
        r.module.padEnd(35) +
        `${r.lines}%`.padEnd(10) +
        `${r.functions}%`.padEnd(12) +
        `${r.branches}%`.padEnd(12) +
        `${r.minCoverage}%`.padEnd(10) +
        r.files,
    );
  });
}

console.log(`\n📈 RESUMO COMPLETO:`);
console.log(`   📁 Total de módulos analisados: ${Object.keys(modules).length}`);
console.log(`   ✅ Módulos com 80%+ de cobertura: ${allResults.filter((r) => !r.below80).length}`);
console.log(`   ⚠️  Módulos abaixo de 80%: ${results.length}`);
console.log(`   🎯 Meta: 80% de cobertura mínima`);

// Mostrar módulos acima de 80%
const above80 = allResults.filter((r) => !r.below80);
if (above80.length > 0) {
  console.log(`\n✅ MÓDULOS COM 80%+ DE COBERTURA (${above80.length}):\n`);
  above80.forEach((r, i) => {
    console.log(
      `${(i + 1).toString().padStart(2)}. ` +
        r.module.padEnd(35) +
        `Lines: ${r.lines.toFixed(1)}% | Functions: ${r.functions.toFixed(1)}% | Branches: ${r.branches.toFixed(1)}% | Mínimo: ${r.minCoverage.toFixed(1)}%`,
    );
  });
}

