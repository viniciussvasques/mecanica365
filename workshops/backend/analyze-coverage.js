const fs = require('fs');

// Ler o arquivo de cobertura
const coverageData = JSON.parse(
  fs.readFileSync('coverage/coverage-final.json', 'utf8'),
);

// Agrupar por módulo
const modules = {};

Object.keys(coverageData).forEach((file) => {
  // Extrair o nome do módulo do caminho
  const moduleMatch = file.match(/modules\/([^\/]+(?:\/[^\/]+)?)/);
  if (!moduleMatch) return;

  const modulePath = moduleMatch[1];
  const parts = modulePath.split('/');
  const moduleName = parts[0] === 'core' || parts[0] === 'shared' || parts[0] === 'workshops'
    ? parts.join('/')
    : parts[0];

  if (!modules[moduleName]) {
    modules[moduleName] = {
      statements: { total: 0, covered: 0 },
      branches: { total: 0, covered: 0 },
      functions: { total: 0, covered: 0 },
      lines: { total: 0, covered: 0 },
      files: 0,
    };
  }

  const fileData = coverageData[file];
  const stats = modules[moduleName];

  // Statements
  const statements = fileData.s || {};
  const statementKeys = Object.keys(statements);
  stats.statements.total += statementKeys.length;
  stats.statements.covered += statementKeys.filter(
    (key) => statements[key] > 0,
  ).length;

  // Branches
  const branches = fileData.b || {};
  const branchKeys = Object.keys(branches);
  stats.branches.total += branchKeys.length;
  stats.branches.covered += branchKeys.filter(
    (key) => {
      const branch = branches[key];
      return Array.isArray(branch) && branch.some((b) => b > 0);
    },
  ).length;

  // Functions
  const functions = fileData.f || {};
  const functionKeys = Object.keys(functions);
  stats.functions.total += functionKeys.length;
  stats.functions.covered += functionKeys.filter(
    (key) => functions[key] > 0,
  ).length;

  // Lines
  const lines = fileData.l || {};
  const lineKeys = Object.keys(lines);
  stats.lines.total += lineKeys.length;
  stats.lines.covered += lineKeys.filter((key) => lines[key] > 0).length;

  stats.files++;
});

// Calcular percentuais e identificar módulos abaixo de 80%
const results = Object.entries(modules)
  .map(([name, stats]) => {
    const statementsPct =
      stats.statements.total > 0
        ? (stats.statements.covered / stats.statements.total) * 100
        : 100;
    const branchesPct =
      stats.branches.total > 0
        ? (stats.branches.covered / stats.branches.total) * 100
        : 100;
    const functionsPct =
      stats.functions.total > 0
        ? (stats.functions.covered / stats.functions.total) * 100
        : 100;
    const linesPct =
      stats.lines.total > 0 ? (stats.lines.covered / stats.lines.total) * 100 : 100;

    const minCoverage = Math.min(
      statementsPct,
      branchesPct,
      functionsPct,
      linesPct,
    );

    return {
      module: name,
      statements: statementsPct.toFixed(2),
      branches: branchesPct.toFixed(2),
      functions: functionsPct.toFixed(2),
      lines: linesPct.toFixed(2),
      minCoverage: minCoverage.toFixed(2),
      files: stats.files,
      below80: minCoverage < 80,
    };
  })
  .filter((r) => r.below80)
  .sort((a, b) => parseFloat(a.minCoverage) - parseFloat(b.minCoverage));

console.log('\n📊 MÓDULOS ABAIXO DE 80% DE COBERTURA:\n');
console.log(
  'Módulo'.padEnd(40) +
    'Statements'.padEnd(12) +
    'Branches'.padEnd(12) +
    'Functions'.padEnd(12) +
    'Lines'.padEnd(12) +
    'Min'.padEnd(10) +
    'Files',
);
console.log('-'.repeat(100));

results.forEach((r) => {
  console.log(
    r.module.padEnd(40) +
      `${r.statements}%`.padEnd(12) +
      `${r.branches}%`.padEnd(12) +
      `${r.functions}%`.padEnd(12) +
      `${r.lines}%`.padEnd(12) +
      `${r.minCoverage}%`.padEnd(10) +
      r.files,
  );
});

console.log(`\n✅ Total de módulos abaixo de 80%: ${results.length}`);
console.log(`📁 Total de módulos analisados: ${Object.keys(modules).length}`);


