module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: {
          paths: {
            '@/*': ['src/*'],
            '@modules/*': ['src/modules/*'],
            '@core/*': ['src/modules/core/*'],
            '@shared/*': ['src/modules/shared/*'],
            '@common/*': ['src/common/*'],
            '@config/*': ['src/config/*'],
            '@database/*': ['src/database/*'],
            '@health/*': ['src/health/*'],
          },
        },
      },
    ],
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@modules/(.*)$': '<rootDir>/modules/$1',
    '^@core/(.*)$': '<rootDir>/modules/core/$1',
    '^@shared/(.*)$': '<rootDir>/modules/shared/$1',
    '^@common/(.*)$': '<rootDir>/common/$1',
    '^@config/(.*)$': '<rootDir>/config/$1',
    '^@database/(.*)$': '<rootDir>/database/$1',
    '^@health/(.*)$': '<rootDir>/health/$1',
  },
  // Configurações simples para reduzir problemas de I/O com múltiplos projetos
  maxWorkers: 1,
  cache: false,
  testTimeout: 15000,
  // Desabilitar haste map para evitar erros de I/O com múltiplos projetos
  haste: {
    enableSymlinks: false,
  },
  // Usar resolver customizado para evitar problemas de I/O
  resolver: undefined,
};

