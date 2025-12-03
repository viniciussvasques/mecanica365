import * as crypto from 'node:crypto';

/**
 * Gera uma senha aleatória segura
 * @param length Tamanho da senha (padrão: 12)
 * @returns Senha aleatória com maiúsculas, minúsculas, números e símbolos
 */
export function generateRandomPassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const allChars = uppercase + lowercase + numbers + symbols;

  // Garantir que tenha pelo menos um de cada tipo
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Preencher o resto com caracteres aleatórios
  const remainingLength = length - 4;
  for (let i = 0; i < remainingLength; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Embaralhar a senha
  return password
    .split('')
    .sort(() => crypto.randomInt(3) - 1)
    .join('');
}
