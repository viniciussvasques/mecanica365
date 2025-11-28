import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Mecânica365 API - ERP para Oficinas Mecânicas';
  }
}
