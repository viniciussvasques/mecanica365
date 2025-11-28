/**
 * Interfaces para dados de diferentes tipos de email
 */

export interface WelcomeEmailData {
  to: string;
  name: string;
  subdomain: string;
  email: string;
  password: string;
  loginUrl: string;
}

export interface PaymentFailedEmailData {
  to: string;
  name: string;
  subdomain: string;
  amount: number;
  currency: string;
  invoiceUrl?: string;
  paymentMethod?: string;
  failureReason?: string;
  retryUrl?: string;
  supportUrl?: string;
}

export interface SubscriptionCancelledEmailData {
  to: string;
  name: string;
  subdomain: string;
  planName: string;
  cancellationDate: Date;
  accessUntilDate: Date;
  reactivateUrl?: string;
  supportUrl?: string;
}

export interface SubscriptionUpdatedEmailData {
  to: string;
  name: string;
  subdomain: string;
  oldPlan: string;
  newPlan: string;
  billingCycle: string;
  nextBillingDate: Date;
  amount: number;
  currency: string;
  loginUrl: string;
}

export interface InvoicePaymentSucceededEmailData {
  to: string;
  name: string;
  subdomain: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  invoiceUrl?: string;
  receiptUrl?: string;
  nextBillingDate?: Date;
}

export interface InvoiceUpcomingEmailData {
  to: string;
  name: string;
  subdomain: string;
  amount: number;
  currency: string;
  dueDate: Date;
  invoiceUrl?: string;
  updatePaymentMethodUrl?: string;
}

export interface TrialEndingEmailData {
  to: string;
  name: string;
  subdomain: string;
  trialEndDate: Date;
  planName: string;
  amount: number;
  currency: string;
  subscribeUrl?: string;
  supportUrl?: string;
}

export interface AccountSuspendedEmailData {
  to: string;
  name: string;
  subdomain: string;
  reason: string;
  reactivateUrl?: string;
  supportUrl?: string;
}

export interface BulkEmailData {
  recipients: Array<{
    email: string;
    name?: string;
    customData?: Record<string, any>;
  }>;
  subject: string;
  htmlContent: string;
  textContent?: string;
  fromName?: string;
  replyTo?: string;
}
