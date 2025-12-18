import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

export interface CloudflareDNSRecord {
  id?: string;
  type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'SRV';
  name: string;
  content: string;
  ttl?: number;
  proxied?: boolean;
  priority?: number;
}

export interface CloudflareZone {
  id: string;
  name: string;
}

interface CloudflareApiResponse<T> {
  success: boolean;
  errors?: unknown[];
  result?: T;
}

@Injectable()
export class CloudflareService {
  private readonly logger = new Logger(CloudflareService.name);
  private readonly httpClient: AxiosInstance;
  private readonly zoneId: string;
  private readonly baseDomain: string;

  constructor() {
    const email = process.env.CLOUDFLARE_EMAIL;
    const apiKey = process.env.CLOUDFLARE_API_KEY;

    if (!email || !apiKey) {
      this.logger.error('Cloudflare credentials not configured');
      throw new Error('Cloudflare credentials not configured');
    }

    this.httpClient = axios.create({
      baseURL: 'https://api.cloudflare.com/client/v4',
      headers: {
        'X-Auth-Email': email,
        'X-Auth-Key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    // Configurado via env ou hardcoded por enquanto
    this.zoneId = process.env.CLOUDFLARE_ZONE_ID || '7ddb2a90032bfd195d470e2a2335e256';
    this.baseDomain = process.env.CLOUDFLARE_BASE_DOMAIN || 'mecanica365.com';
  }

  /**
   * Cria um registro DNS para um subdomain
   */
  async createDNSRecord(subdomain: string, record: Omit<CloudflareDNSRecord, 'name'>): Promise<boolean> {
    try {
      const fullDomain = subdomain === '@' ? this.baseDomain : `${subdomain}.${this.baseDomain}`;

      // Verifica se o registro já existe
      const existingRecord = await this.getDNSRecord(fullDomain);
      if (existingRecord) {
        this.logger.log(`DNS record already exists for ${fullDomain}`);
        return true;
      }

      const dnsRecord: CloudflareDNSRecord = {
        ...record,
        name: fullDomain,
        ttl: record.ttl || 1, // Auto TTL
        proxied: record.proxied ?? true, // Proxied por padrão
      };

      const response = (await this.httpClient.post(
        `/zones/${this.zoneId}/dns_records`,
        dnsRecord,
      )) as { data: CloudflareApiResponse<CloudflareDNSRecord> };
      const data = response.data;

      if (data.success) {
        this.logger.log(`✅ DNS record created: ${fullDomain} → ${record.content}`);
        return true;
      }

      this.logger.error(
        `❌ Failed to create DNS record for ${fullDomain}:`,
        data.errors ?? [],
      );
      return false;
    } catch (error) {
      this.logger.error(`❌ Error creating DNS record for ${subdomain}:`, error.message);
      return false;
    }
  }

  /**
   * Remove um registro DNS
   */
  async deleteDNSRecord(subdomain: string): Promise<boolean> {
    try {
      const fullDomain = subdomain === '@' ? this.baseDomain : `${subdomain}.${this.baseDomain}`;
      const record = await this.getDNSRecord(fullDomain);

      if (!record) {
        this.logger.warn(`DNS record not found for ${fullDomain}`);
        return true;
      }

      const response = (await this.httpClient.delete(
        `/zones/${this.zoneId}/dns_records/${record.id}`,
      )) as { data: CloudflareApiResponse<CloudflareDNSRecord> };
      const data = response.data;

      if (data.success) {
        this.logger.log(`✅ DNS record deleted: ${fullDomain}`);
        return true;
      }

      this.logger.error(
        `❌ Failed to delete DNS record for ${fullDomain}:`,
        data.errors ?? [],
      );
      return false;
    } catch (error) {
      this.logger.error(`❌ Error deleting DNS record for ${subdomain}:`, error.message);
      return false;
    }
  }

  /**
   * Busca um registro DNS por nome
   */
  private async getDNSRecord(name: string): Promise<CloudflareDNSRecord | null> {
    try {
      const response = (await this.httpClient.get(
        `/zones/${this.zoneId}/dns_records?name=${encodeURIComponent(name)}`,
      )) as { data: CloudflareApiResponse<CloudflareDNSRecord[]> };
      const data = response.data;

      if (data?.success && Array.isArray(data?.result) && data.result.length > 0) {
        return data.result[0] as CloudflareDNSRecord;
      }

      return null;
    } catch (error: any) {
      this.logger.error(`Error fetching DNS record for ${name}:`, error?.message || String(error));
      return null;
    }
  }

  /**
   * Lista todos os registros DNS
   */
  async listDNSRecords(): Promise<CloudflareDNSRecord[]> {
    try {
      const response = (await this.httpClient.get(
        `/zones/${this.zoneId}/dns_records`,
      )) as { data: CloudflareApiResponse<CloudflareDNSRecord[]> };
      const data = response.data;

      if (data?.success && Array.isArray(data?.result)) {
        return data.result as CloudflareDNSRecord[];
      }

      return [];
    } catch (error: any) {
      this.logger.error('Error listing DNS records:', error?.message || String(error));
      return [];
    }
  }

  /**
   * Cria subdomínio para um tenant
   */
  async createTenantSubdomain(subdomain: string): Promise<boolean> {
    const ip = process.env.CLOUDFLARE_SERVER_IP || '66.93.25.251';

    return this.createDNSRecord(subdomain, {
      type: 'A',
      content: ip,
      proxied: true,
    });
  }

  /**
   * Remove subdomínio de um tenant
   */
  async deleteTenantSubdomain(subdomain: string): Promise<boolean> {
    return this.deleteDNSRecord(subdomain);
  }

  /**
   * Valida se um domínio está disponível
   */
  async isDomainAvailable(subdomain: string): Promise<boolean> {
    const fullDomain = `${subdomain}.${this.baseDomain}`;
    const record = await this.getDNSRecord(fullDomain);
    return !record;
  }

  /**
   * Verifica status da zona
   */
  async getZoneStatus(): Promise<CloudflareZone | null> {
    try {
      const response = (await this.httpClient.get(
        `/zones/${this.zoneId}`,
      )) as { data: CloudflareApiResponse<CloudflareZone> };
      const data = response.data;

      if (data?.success && data?.result) {
        return data.result as CloudflareZone;
      }

      return null;
    } catch (error: any) {
      this.logger.error('Error fetching zone status:', error?.message || String(error));
      return null;
    }
  }
}
