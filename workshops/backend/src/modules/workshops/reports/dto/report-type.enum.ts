/**
 * Tipos de relatório disponíveis
 */
export enum ReportType {
  SALES = 'sales', // Relatório de vendas
  SERVICES = 'services', // Relatório de serviços
  FINANCIAL = 'financial', // Relatório financeiro
  INVENTORY = 'inventory', // Relatório de estoque
  CUSTOMERS = 'customers', // Relatório de clientes
  MECHANICS = 'mechanics', // Relatório de mecânicos
  QUOTES = 'quotes', // Relatório de orçamentos
  INVOICES = 'invoices', // Relatório de faturas
  PAYMENTS = 'payments', // Relatório de pagamentos
}

/**
 * Formato de exportação do relatório
 */
export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
  JSON = 'json',
}
