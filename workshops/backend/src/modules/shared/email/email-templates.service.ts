/**
 * Serviço de templates de email profissionais
 * Centraliza toda a lógica de geração de templates HTML e texto
 */

export class EmailTemplatesService {
  /**
   * Template base compartilhado por todos os emails
   */
  private getBaseTemplate(
    title: string,
    content: string,
    buttonText?: string,
    buttonUrl?: string,
  ): string {
    const buttonHtml =
      buttonText && buttonUrl
        ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${buttonUrl}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">${buttonText}</a>
      </div>
      `
        : '';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">${title}</h1>
    </div>
    
    <div style="padding: 40px 30px;">
      ${content}
      ${buttonHtml}
      
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
      
      <p style="font-size: 14px; color: #666; margin: 0;">
        Se você tiver dúvidas, entre em contato conosco através do nosso suporte.<br>
        Este é um email automático, por favor não responda diretamente.
      </p>
    </div>
  </div>
  
  <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Mecânica365. Todos os direitos reservados.</p>
    <p style="margin: 5px 0;">
      <a href="${process.env.FRONTEND_URL || 'https://mecanica365.com'}" style="color: #667eea; text-decoration: none;">Acesse nosso site</a> | 
      <a href="${process.env.FRONTEND_URL || 'https://mecanica365.com'}/suporte" style="color: #667eea; text-decoration: none;">Suporte</a>
    </p>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Formata valor monetário
   */
  private formatCurrency(amount: number, currency: string = 'BRL'): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency === 'brl' ? 'BRL' : currency.toUpperCase(),
    }).format(amount / 100); // Stripe usa centavos
  }

  /**
   * Formata data
   */
  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  getWelcomeEmailTemplate(data: {
    name: string;
    subdomain: string;
    email: string;
    password: string;
    loginUrl: string;
  }): string {
    const content = `
      <p style="font-size: 16px; margin: 0 0 20px 0;">Olá <strong>${data.name}</strong>,</p>
      
      <p style="font-size: 16px; color: #555; margin: 0 0 20px 0;">
        Sua conta foi criada com sucesso! Agora você pode acessar o sistema e começar a gerenciar sua oficina de forma profissional.
      </p>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
        <h2 style="margin-top: 0; color: #667eea; font-size: 20px;">Suas Credenciais de Acesso</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #555;">URL de Acesso:</td>
            <td style="padding: 8px 0;"><a href="${data.loginUrl}" style="color: #667eea; text-decoration: none;">${data.loginUrl}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #555;">Email:</td>
            <td style="padding: 8px 0; color: #333;">${data.email}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #555;">Senha Temporária:</td>
            <td style="padding: 8px 0;">
              <code style="background: #e9ecef; padding: 6px 12px; border-radius: 4px; font-size: 14px; font-family: 'Courier New', monospace; color: #d63384;">${data.password}</code>
            </td>
          </tr>
        </table>
      </div>
      
      <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
        <p style="margin: 0; color: #856404;">
          <strong>⚠️ Importante:</strong> Por segurança, altere sua senha no primeiro acesso ao sistema.
        </p>
      </div>
    `;

    return this.getBaseTemplate(
      'Bem-vindo ao Mecânica365!',
      content,
      'Acessar Sistema',
      data.loginUrl,
    );
  }

  getPaymentFailedEmailTemplate(data: {
    name: string;
    subdomain: string;
    amount: number;
    currency: string;
    invoiceUrl?: string;
    paymentMethod?: string;
    failureReason?: string;
    retryUrl?: string;
    supportUrl?: string;
  }): string {
    const formattedAmount = this.formatCurrency(data.amount, data.currency);
    const reason =
      data.failureReason || 'Não foi possível processar o pagamento.';

    const content = `
      <p style="font-size: 16px; margin: 0 0 20px 0;">Olá <strong>${data.name}</strong>,</p>
      
      <p style="font-size: 16px; color: #555; margin: 0 0 20px 0;">
        Infelizmente, não conseguimos processar o pagamento da sua assinatura.
      </p>
      
      <div style="background: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
        <h2 style="margin-top: 0; color: #721c24; font-size: 20px;">⚠️ Pagamento Não Processado</h2>
        <p style="margin: 10px 0; color: #721c24;">
          <strong>Valor:</strong> ${formattedAmount}<br>
          <strong>Motivo:</strong> ${reason}
          ${data.paymentMethod ? `<br><strong>Método:</strong> ${data.paymentMethod}` : ''}
        </p>
      </div>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #333; font-size: 18px;">O que fazer agora?</h3>
        <ol style="padding-left: 20px; color: #555;">
          <li style="margin: 10px 0;">Verifique se há saldo suficiente no seu cartão</li>
          <li style="margin: 10px 0;">Confirme se os dados do cartão estão corretos</li>
          <li style="margin: 10px 0;">Entre em contato com seu banco se o problema persistir</li>
          <li style="margin: 10px 0;">Tente novamente ou atualize seu método de pagamento</li>
        </ol>
      </div>
      
      ${
        data.invoiceUrl
          ? `
      <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0066cc;">
        <p style="margin: 0; color: #004085;">
          <strong>📄 Visualizar Fatura:</strong> <a href="${data.invoiceUrl}" style="color: #0066cc;">Clique aqui para ver os detalhes da fatura</a>
        </p>
      </div>
      `
          : ''
      }
    `;

    const retryButton = data.retryUrl
      ? {
          text: 'Tentar Pagamento Novamente',
          url: data.retryUrl,
        }
      : undefined;

    return this.getBaseTemplate(
      'Pagamento Não Processado',
      content,
      retryButton?.text,
      retryButton?.url,
    );
  }

  getSubscriptionCancelledEmailTemplate(data: {
    name: string;
    subdomain: string;
    planName: string;
    cancellationDate: Date;
    accessUntilDate: Date;
    reactivateUrl?: string;
    supportUrl?: string;
  }): string {
    const content = `
      <p style="font-size: 16px; margin: 0 0 20px 0;">Olá <strong>${data.name}</strong>,</p>
      
      <p style="font-size: 16px; color: #555; margin: 0 0 20px 0;">
        Recebemos sua solicitação de cancelamento da assinatura <strong>${data.planName}</strong>.
      </p>
      
      <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
        <h2 style="margin-top: 0; color: #856404; font-size: 20px;">📅 Datas Importantes</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #856404;">Cancelamento solicitado em:</td>
            <td style="padding: 8px 0; color: #856404;">${this.formatDate(data.cancellationDate)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #856404;">Acesso até:</td>
            <td style="padding: 8px 0; color: #856404;"><strong>${this.formatDate(data.accessUntilDate)}</strong></td>
          </tr>
        </table>
      </div>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #333; font-size: 18px;">O que acontece agora?</h3>
        <ul style="padding-left: 20px; color: #555;">
          <li style="margin: 10px 0;">Você continuará com acesso completo até <strong>${this.formatDate(data.accessUntilDate)}</strong></li>
          <li style="margin: 10px 0;">Após essa data, sua conta será suspensa</li>
          <li style="margin: 10px 0;">Todos os seus dados serão mantidos por 30 dias</li>
          <li style="margin: 10px 0;">Você pode reativar sua assinatura a qualquer momento antes da suspensão</li>
        </ul>
      </div>
      
      <p style="font-size: 16px; color: #555; margin: 20px 0;">
        Sentiremos sua falta! Se mudou de ideia, você pode reativar sua assinatura a qualquer momento.
      </p>
    `;

    return this.getBaseTemplate(
      'Assinatura Cancelada',
      content,
      data.reactivateUrl ? 'Reativar Assinatura' : undefined,
      data.reactivateUrl,
    );
  }

  getSubscriptionUpdatedEmailTemplate(data: {
    name: string;
    subdomain: string;
    oldPlan: string;
    newPlan: string;
    billingCycle: string;
    nextBillingDate: Date;
    amount: number;
    currency: string;
    loginUrl: string;
  }): string {
    const formattedAmount = this.formatCurrency(data.amount, data.currency);
    const cycleText = data.billingCycle === 'annual' ? 'anual' : 'mensal';

    const content = `
      <p style="font-size: 16px; margin: 0 0 20px 0;">Olá <strong>${data.name}</strong>,</p>
      
      <p style="font-size: 16px; color: #555; margin: 0 0 20px 0;">
        Sua assinatura foi atualizada com sucesso!
      </p>
      
      <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
        <h2 style="margin-top: 0; color: #155724; font-size: 20px;">✅ Alterações na Assinatura</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #155724;">Plano Anterior:</td>
            <td style="padding: 8px 0; color: #155724;">${data.oldPlan}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #155724;">Novo Plano:</td>
            <td style="padding: 8px 0; color: #155724;"><strong>${data.newPlan}</strong></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #155724;">Ciclo de Cobrança:</td>
            <td style="padding: 8px 0; color: #155724;">${cycleText}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #155724;">Valor:</td>
            <td style="padding: 8px 0; color: #155724;"><strong>${formattedAmount}</strong></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #155724;">Próxima Cobrança:</td>
            <td style="padding: 8px 0; color: #155724;">${this.formatDate(data.nextBillingDate)}</td>
          </tr>
        </table>
      </div>
      
      <p style="font-size: 16px; color: #555; margin: 20px 0;">
        Suas novas funcionalidades já estão disponíveis! Acesse o sistema para começar a usar.
      </p>
    `;

    return this.getBaseTemplate(
      'Assinatura Atualizada',
      content,
      'Acessar Sistema',
      data.loginUrl,
    );
  }

  getInvoicePaymentSucceededEmailTemplate(data: {
    name: string;
    subdomain: string;
    invoiceNumber: string;
    amount: number;
    currency: string;
    invoiceUrl?: string;
    receiptUrl?: string;
    nextBillingDate?: Date;
  }): string {
    const formattedAmount = this.formatCurrency(data.amount, data.currency);

    const content = `
      <p style="font-size: 16px; margin: 0 0 20px 0;">Olá <strong>${data.name}</strong>,</p>
      
      <p style="font-size: 16px; color: #555; margin: 0 0 20px 0;">
        Recebemos seu pagamento com sucesso! Obrigado pela confiança.
      </p>
      
      <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
        <h2 style="margin-top: 0; color: #155724; font-size: 20px;">✅ Pagamento Confirmado</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #155724;">Número da Fatura:</td>
            <td style="padding: 8px 0; color: #155724;">${data.invoiceNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #155724;">Valor Pago:</td>
            <td style="padding: 8px 0; color: #155724;"><strong>${formattedAmount}</strong></td>
          </tr>
          ${
            data.nextBillingDate
              ? `
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #155724;">Próxima Cobrança:</td>
            <td style="padding: 8px 0; color: #155724;">${this.formatDate(data.nextBillingDate)}</td>
          </tr>
          `
              : ''
          }
        </table>
      </div>
      
      ${this.renderInvoiceReceiptSection(data)}
      
      <p style="font-size: 16px; color: #555; margin: 20px 0;">
        Continue aproveitando todos os recursos do Mecânica365!
      </p>
    `;

    return this.getBaseTemplate('Pagamento Confirmado', content);
  }

  getInvoiceUpcomingEmailTemplate(data: {
    name: string;
    subdomain: string;
    amount: number;
    currency: string;
    dueDate: Date;
    invoiceUrl?: string;
    updatePaymentMethodUrl?: string;
  }): string {
    const formattedAmount = this.formatCurrency(data.amount, data.currency);

    const content = `
      <p style="font-size: 16px; margin: 0 0 20px 0;">Olá <strong>${data.name}</strong>,</p>
      
      <p style="font-size: 16px; color: #555; margin: 0 0 20px 0;">
        Esta é uma notificação de que sua próxima fatura será processada em breve.
      </p>
      
      <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
        <h2 style="margin-top: 0; color: #856404; font-size: 20px;">📅 Próxima Cobrança</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #856404;">Valor:</td>
            <td style="padding: 8px 0; color: #856404;"><strong>${formattedAmount}</strong></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #856404;">Data de Cobrança:</td>
            <td style="padding: 8px 0; color: #856404;"><strong>${this.formatDate(data.dueDate)}</strong></td>
          </tr>
        </table>
      </div>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #333; font-size: 18px;">O que você precisa fazer?</h3>
        <ul style="padding-left: 20px; color: #555;">
          <li style="margin: 10px 0;">Certifique-se de que há saldo suficiente no método de pagamento cadastrado</li>
          <li style="margin: 10px 0;">Verifique se seus dados de pagamento estão atualizados</li>
          ${data.updatePaymentMethodUrl ? `<li style="margin: 10px 0;">Se necessário, <a href="${data.updatePaymentMethodUrl}" style="color: #667eea;">atualize seu método de pagamento</a></li>` : ''}
        </ul>
      </div>
      
      ${
        data.invoiceUrl
          ? `
      <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0066cc;">
        <p style="margin: 0; color: #004085;">
          <strong>📄 Visualizar Detalhes:</strong> <a href="${data.invoiceUrl}" style="color: #0066cc;">Clique aqui para ver a fatura</a>
        </p>
      </div>
      `
          : ''
      }
    `;

    return this.getBaseTemplate(
      'Próxima Cobrança Programada',
      content,
      data.updatePaymentMethodUrl ? 'Atualizar Método de Pagamento' : undefined,
      data.updatePaymentMethodUrl,
    );
  }

  getTrialEndingEmailTemplate(data: {
    name: string;
    subdomain: string;
    trialEndDate: Date;
    planName: string;
    amount: number;
    currency: string;
    subscribeUrl?: string;
    supportUrl?: string;
  }): string {
    const formattedAmount = this.formatCurrency(data.amount, data.currency);

    const content = `
      <p style="font-size: 16px; margin: 0 0 20px 0;">Olá <strong>${data.name}</strong>,</p>
      
      <p style="font-size: 16px; color: #555; margin: 0 0 20px 0;">
        Seu período de teste está chegando ao fim!
      </p>
      
      <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
        <h2 style="margin-top: 0; color: #856404; font-size: 20px;">⏰ Período de Teste</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #856404;">Plano:</td>
            <td style="padding: 8px 0; color: #856404;"><strong>${data.planName}</strong></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #856404;">Teste termina em:</td>
            <td style="padding: 8px 0; color: #856404;"><strong>${this.formatDate(data.trialEndDate)}</strong></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #856404;">Valor após o teste:</td>
            <td style="padding: 8px 0; color: #856404;"><strong>${formattedAmount}</strong></td>
          </tr>
        </table>
      </div>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #333; font-size: 18px;">O que acontece depois?</h3>
        <ul style="padding-left: 20px; color: #555;">
          <li style="margin: 10px 0;">Após o término do teste, sua assinatura será ativada automaticamente</li>
          <li style="margin: 10px 0;">A cobrança será feita no método de pagamento cadastrado</li>
          <li style="margin: 10px 0;">Você continuará com acesso completo a todas as funcionalidades</li>
        </ul>
      </div>
      
      <p style="font-size: 16px; color: #555; margin: 20px 0;">
        Se você não deseja continuar, pode cancelar a assinatura antes do término do teste.
      </p>
    `;

    return this.getBaseTemplate(
      'Seu Período de Teste Está Terminando',
      content,
      data.subscribeUrl ? 'Continuar Assinatura' : undefined,
      data.subscribeUrl,
    );
  }

  getAccountSuspendedEmailTemplate(data: {
    name: string;
    subdomain: string;
    reason: string;
    reactivateUrl?: string;
    supportUrl?: string;
  }): string {
    const content = `
      <p style="font-size: 16px; margin: 0 0 20px 0;">Olá <strong>${data.name}</strong>,</p>
      
      <p style="font-size: 16px; color: #555; margin: 0 0 20px 0;">
        Infelizmente, sua conta foi suspensa.
      </p>
      
      <div style="background: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
        <h2 style="margin-top: 0; color: #721c24; font-size: 20px;">⚠️ Conta Suspensa</h2>
        <p style="margin: 10px 0; color: #721c24;">
          <strong>Motivo:</strong> ${data.reason}
        </p>
      </div>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #333; font-size: 18px;">O que isso significa?</h3>
        <ul style="padding-left: 20px; color: #555;">
          <li style="margin: 10px 0;">Seu acesso ao sistema foi temporariamente bloqueado</li>
          <li style="margin: 10px 0;">Todos os seus dados estão seguros e preservados</li>
          <li style="margin: 10px 0;">Você pode reativar sua conta seguindo as instruções abaixo</li>
        </ul>
      </div>
      
      <p style="font-size: 16px; color: #555; margin: 20px 0;">
        Se você acredita que isso é um erro ou precisa de ajuda, entre em contato com nosso suporte.
      </p>
    `;

    return this.getBaseTemplate(
      'Conta Suspensa',
      content,
      data.reactivateUrl ? 'Reativar Conta' : undefined,
      data.reactivateUrl,
    );
  }

  /**
   * Versões em texto puro para melhor entregabilidade
   */
  getWelcomeEmailTextVersion(data: {
    name: string;
    subdomain: string;
    email: string;
    password: string;
    loginUrl: string;
  }): string {
    return `
Bem-vindo ao Mecânica365!

Olá ${data.name},

Sua conta foi criada com sucesso! Agora você pode acessar o sistema e começar a gerenciar sua oficina.

SUAS CREDENCIAIS DE ACESSO:
URL de Acesso: ${data.loginUrl}
Email: ${data.email}
Senha Temporária: ${data.password}

⚠️ IMPORTANTE: Por segurança, altere sua senha no primeiro acesso.

Acesse: ${data.loginUrl}

Se você não solicitou esta conta, ignore este email.
Este é um email automático, por favor não responda.

© ${new Date().getFullYear()} Mecânica365. Todos os direitos reservados.
    `.trim();
  }

  getPaymentFailedEmailTextVersion(data: {
    name: string;
    amount: number;
    currency: string;
    failureReason?: string;
    retryUrl?: string;
  }): string {
    const formattedAmount = this.formatCurrency(data.amount, data.currency);
    return `
Pagamento Não Processado

Olá ${data.name},

Infelizmente, não conseguimos processar o pagamento da sua assinatura.

VALOR: ${formattedAmount}
MOTIVO: ${data.failureReason || 'Não foi possível processar o pagamento.'}

O QUE FAZER AGORA:
1. Verifique se há saldo suficiente no seu cartão
2. Confirme se os dados do cartão estão corretos
3. Entre em contato com seu banco se o problema persistir
4. Tente novamente ou atualize seu método de pagamento

${data.retryUrl ? `Tentar novamente: ${data.retryUrl}` : ''}

Se você tiver dúvidas, entre em contato com nosso suporte.

© ${new Date().getFullYear()} Mecânica365. Todos os direitos reservados.
    `.trim();
  }

  private renderInvoiceReceiptSection(data: {
    invoiceUrl?: string;
    receiptUrl?: string;
  }): string {
    if (!data.invoiceUrl && !data.receiptUrl) {
      return '';
    }

    const invoiceLink = data.invoiceUrl
      ? `<strong>📄 Visualizar Fatura:</strong> <a href="${data.invoiceUrl}" style="color: #0066cc;">Clique aqui</a><br>`
      : '';
    const receiptLink = data.receiptUrl
      ? `<strong>🧾 Recibo:</strong> <a href="${data.receiptUrl}" style="color: #0066cc;">Baixar recibo</a>`
      : '';

    return `
      <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0066cc;">
        <p style="margin: 0; color: #004085;">
          ${invoiceLink}
          ${receiptLink}
        </p>
      </div>
      `;
  }

  /**
   * Template de email para recuperação de senha
   */
  getPasswordResetEmailTemplate(data: {
    name: string;
    resetUrl: string;
    expiresInMinutes: number;
    workshopName?: string;
  }): string {
    const content = `
      <p style="font-size: 16px; margin: 0 0 20px 0;">Olá <strong>${data.name}</strong>,</p>
      
      <p style="font-size: 16px; color: #555; margin: 0 0 20px 0;">
        Recebemos uma solicitação para redefinir a senha da sua conta${data.workshopName ? ` na oficina <strong>${data.workshopName}</strong>` : ''}.
      </p>

      <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffcc00;">
        <p style="margin: 0; color: #856404;">
          <strong>⚠️ Importante:</strong><br>
          Este link é válido por <strong>${data.expiresInMinutes} minutos</strong>.<br>
          Se você não solicitou essa alteração, ignore este email.
        </p>
      </div>

      <p style="font-size: 16px; color: #555; margin: 0 0 20px 0;">
        Clique no botão abaixo para criar uma nova senha:
      </p>
    `;

    return this.getBaseTemplate(
      '🔐 Recuperação de Senha',
      content,
      'Redefinir Minha Senha',
      data.resetUrl,
    );
  }

  /**
   * Template de email para confirmação de senha alterada
   */
  getPasswordChangedEmailTemplate(data: {
    name: string;
    changedAt: Date;
    workshopName?: string;
  }): string {
    const content = `
      <p style="font-size: 16px; margin: 0 0 20px 0;">Olá <strong>${data.name}</strong>,</p>
      
      <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
        <p style="margin: 0; color: #155724;">
          <strong>✅ Senha Alterada com Sucesso!</strong><br>
          Sua senha foi alterada em ${this.formatDate(data.changedAt)}${data.workshopName ? ` para a oficina <strong>${data.workshopName}</strong>` : ''}.
        </p>
      </div>

      <p style="font-size: 16px; color: #555; margin: 0 0 20px 0;">
        Se você não realizou essa alteração, entre em contato imediatamente com o suporte.
      </p>

      <div style="background: #f8d7da; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
        <p style="margin: 0; color: #721c24;">
          <strong>🚨 Não foi você?</strong><br>
          Se você não alterou sua senha, sua conta pode ter sido comprometida. 
          Entre em contato com o suporte imediatamente.
        </p>
      </div>
    `;

    return this.getBaseTemplate('🔐 Senha Alterada', content);
  }

  /**
   * Template de email para reset de senha pelo admin
   */
  getAdminPasswordResetEmailTemplate(data: {
    userName: string;
    userEmail: string;
    workshopName: string;
    tempPassword: string;
    loginUrl: string;
  }): string {
    const content = `
      <p style="font-size: 16px; margin: 0 0 20px 0;">Olá <strong>${data.userName}</strong>,</p>
      
      <p style="font-size: 16px; color: #555; margin: 0 0 20px 0;">
        O administrador da oficina <strong>${data.workshopName}</strong> redefiniu sua senha.
      </p>

      <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0066cc;">
        <p style="margin: 0; color: #004085;">
          <strong>📧 Email:</strong> ${data.userEmail}<br>
          <strong>🔑 Senha Temporária:</strong> <code style="background: #f8f9fa; padding: 2px 6px; border-radius: 4px; font-size: 18px;">${data.tempPassword}</code>
        </p>
      </div>

      <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffcc00;">
        <p style="margin: 0; color: #856404;">
          <strong>⚠️ Importante:</strong><br>
          Você será solicitado a alterar sua senha no primeiro acesso.
        </p>
      </div>
    `;

    return this.getBaseTemplate(
      '🔐 Sua Senha Foi Redefinida',
      content,
      'Acessar Sistema',
      data.loginUrl,
    );
  }
}
