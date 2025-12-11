import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scrypt,
} from 'node:crypto';
import { promisify } from 'node:util';
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';

const scryptAsync = promisify(scrypt);

/**
 * Utilitário para criptografia AES-256-GCM
 */
export class EncryptionUtil {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly IV_LENGTH = 16; // 128 bits
  private static readonly SALT_LENGTH = 64;

  /**
   * Gera uma chave de criptografia a partir de uma senha
   */
  private static async deriveKey(
    password: string,
    salt: Buffer,
  ): Promise<Buffer> {
    return (await scryptAsync(password, salt, this.KEY_LENGTH)) as Buffer;
  }

  /**
   * Criptografa um arquivo
   */
  static async encryptFile(
    inputPath: string,
    outputPath: string,
    password: string,
  ): Promise<void> {
    if (!existsSync(inputPath)) {
      throw new Error(`Arquivo não encontrado: ${inputPath}`);
    }

    const salt = randomBytes(this.SALT_LENGTH);
    const iv = randomBytes(this.IV_LENGTH);
    const key = await this.deriveKey(password, salt);

    const cipher = createCipheriv(this.ALGORITHM, key, iv);

    const input = readFileSync(inputPath);
    const encrypted = Buffer.concat([cipher.update(input), cipher.final()]);

    const authTag = cipher.getAuthTag();

    // Formato: salt (64 bytes) + iv (16 bytes) + authTag (16 bytes) + dados criptografados
    const output = Buffer.concat([salt, iv, authTag, encrypted]);

    writeFileSync(outputPath, output);
  }

  /**
   * Descriptografa um arquivo
   */
  static async decryptFile(
    inputPath: string,
    outputPath: string,
    password: string,
  ): Promise<void> {
    if (!existsSync(inputPath)) {
      throw new Error(`Arquivo não encontrado: ${inputPath}`);
    }

    const input = readFileSync(inputPath);

    // Extrair componentes
    const salt = input.subarray(0, this.SALT_LENGTH);
    const iv = input.subarray(
      this.SALT_LENGTH,
      this.SALT_LENGTH + this.IV_LENGTH,
    );
    const authTag = input.subarray(
      this.SALT_LENGTH + this.IV_LENGTH,
      this.SALT_LENGTH + this.IV_LENGTH + 16,
    );
    const encrypted = input.subarray(this.SALT_LENGTH + this.IV_LENGTH + 16);

    const key = await this.deriveKey(password, salt);

    const decipher = createDecipheriv(this.ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    writeFileSync(outputPath, decrypted);
  }

  /**
   * Verifica se um arquivo está criptografado (verifica o formato)
   */
  static isEncrypted(filePath: string): boolean {
    if (!existsSync(filePath)) {
      return false;
    }

    const stats = statSync(filePath);
    // Arquivo criptografado deve ter pelo menos salt + iv + authTag = 96 bytes
    return stats.size > 96;
  }
}
